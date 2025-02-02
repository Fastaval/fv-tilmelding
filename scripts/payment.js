"using strict";

class FVSignupPayment {

  static payment_page;
  static explanation_div;
  static spinner;
  static config;

  static token;
  static status;
  static info;

  static get_info() {
    let info = FVSignupModuleSubmit.get_info();
    if (info !== undefined) return info;

    return this.info;
  }

  static init_payment_page() {
    this.status = FVSignup.get_status();
    this.token = FVSignup.get_token();

    let page_content = jQuery(".page-content");

    this.payment_page = jQuery("<div id='payment-page'></div>");
    this.payment_page.hide();
    page_content.append(this.payment_page);

    FVSignup.load_config('payment', function (config) {
      FVSignupPayment.config = config;
      FVSignupPayment.config.loaded = true;
      FVSignupPayment.render_payment();
      FVSignupPayment.page_ready();
    });
  }

  static init(callback) {
    FVSignup.load_config('payment', function (config) {
      FVSignupPayment.config = config;
      FVSignupPayment.config.loaded = true;
      callback();
    });
  }

  static render_payment() {
    let lang = FVSignup.get_lang();

    let header = jQuery(`<h2>${this.config.headline[lang]}</h2>`);
    this.payment_page.append(header);

    this.explanation_div = jQuery(`<div id="payment-explanation-text"></div>`);
    this.explanation_div.css('margin-bottom', '5rem');
    this.payment_page.append(this.explanation_div);

    this.spinner = jQuery('<div id="payment-pending-spinner"></div>');
    this.spinner.css('background-color', 'black');
    this.spinner.css('height', '5px');
    this.spinner.css('width', '10%');
    this.spinner.css('animation-duration', '33ms');
    this.spinner.hide();
    this.payment_page.append(this.spinner);

    let return_text = this.config.return_text[lang];
    let return_paragraph = jQuery(`<p>${return_text}</p>`);
    this.payment_page.append(return_paragraph);

    let return_button__text = this.config.return_button[lang];
    let return_button = jQuery(`<button>${return_button__text}</button>`);
    return_button.on('click', function() {
      FVSignup.hide_all();
      FVSignup.show_signup();
    })
    this.payment_page.append(return_button);
  }

  static show_payment() {
    FVSignup.hide_all();

    if(this.payment_page == undefined) {
      this.init_payment_page();
    } else {
      this.page_ready();
    }

    // Scroll to top
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('scroll')) // Reset top menu
    
    // Set addressbar
    window.history.pushState({page:"payment"},"", FVSignup.get_base_url()+"payment/");
  }

  static page_ready() {
    let lang = FVSignup.get_lang()

    if (this.status == 'cancel') {
      this.explanation_div.html(this.config.cancel_text[lang]);
      this.cancel_payment();
    } else if (this.status == 'accept') {
      this.explanation_div.html(this.config.pending_text[lang]);
      this.check_payment_status();
    } else {
      // Show login dialog
      this.explanation_div.html(`<p>${this.config.login_text[lang]}</p>`);
      this.explanation_div.append(
        `<p>
          <label for="payment-login-id">${this.config.signup_id[lang]}</label>
          <input type="text" id="payment-login-id"></input>
        </p>`
      );
      this.explanation_div.append(
        `<p>
          <label for="payment-login-pass">${this.config.signup_pass[lang]}</label>
          <input type="password" id="payment-login-pass"></input>
        </p>`
      );
      let login_button = jQuery(`<button>${this.config.load[lang]}</button>`);
      this.explanation_div.append(login_button);
      login_button.on('click', function() {
        FVSignupPayment.click_login();
      })

      this.explanation_div.find('input').on('keypress', function(evt) {
        if (evt.originalEvent.key == "Enter") login_button.click();
      })
    }

    this.payment_page.show();
  }

  static post(path, data, success_callcack, error_callback = null) {
    jQuery.ajax({
      url: FVSignup.get_infosys_url() + path,
      type: 'POST',
      data,
      success: function(response) {
        if (response.status == 'success') {
          success_callcack(response);
        } else {
          error_callback == null ? FVSignup.com_error(): error_callback(response);
        }
      },
      error: function(jqXHR, status, error) {
        error_callback == null ? FVSignup.com_error(): error_callback(jqXHR.responseJSON);
      }
    })
  }

  static click_login() {
    this.info = {
      id: jQuery('#payment-login-id').val(),
      pass: jQuery('#payment-login-pass').val(),
    }

    this.post(
      '/payment/participanttotal',
      this.get_info(),
      function (response) {
        FVSignupPayment.login_response(response.totals);
      },
      function(response) {
        if (response.message == 'wrong credentials') {
          alert(FVSignupPayment.config.invalid_login[FVSignup.get_lang()]);
          return;
        }
        console.log(response);
        FVSignup.com_error();
      }
    )
  }

  static goto_payment() {
    this.post(
      '/payment/create',
      this.get_info(),
      function(response) {
        window.open(response.url, '_blank').focus();
      },
      function(response) {
        if (response.message == 'no payment needed') {
          alert(FVSignupPayment.config.already_paid[FVSignup.get_lang()])
          return;
        } 
        if (response.message == 'unconfirmed payments') {
          alert(FVSignupPayment.config.pending_payment[FVSignup.get_lang()])
          return;
        } 
        console.log(response);
        FVSignup.com_error();
      }
    );
  }

  static payment_redirect() {
    let params = new URLSearchParams(window.location.search);
    if (!params.has('hash')) {
      FVSignup.load_signup();
      return;
    }

    let hash = params.get('hash');
    
    this.post(
      '/payment/create',
      {
        hash: hash,
      },
      function(response) {
        window.location.href = response.url;
      },
      function(response) {
        if (response.message == 'no payment needed') {
          alert(FVSignupPayment.config.already_paid[FVSignup.get_lang()])
        } else if (response.message == 'unconfirmed payments') {
          alert(FVSignupPayment.config.pending_payment[FVSignup.get_lang()])
        } else if (response.message == 'Incorrect credentials') {
          alert(FVSignupPayment.config.invalid_login[FVSignup.get_lang()])
        } else {
          console.log(response);
          FVSignup.com_error();
        }
        FVSignup.load_signup();
      }
    );
  }

  static cancel_payment() {
    this.post(
      '/payment/cancel',
      { token: this.token },
      function() {}
    );
  }

  static check_payment_status() {
    this.post(
      '/payment/status',
      { token: this.token },
      function(response) {
        FVSignupPayment.payment_status_response(response.payment_status);
      }
    )
  }

  static login_response(totals) {
    let lang = FVSignup.get_lang();
    
    let pay_text = this.config.payment_text[lang].replaceAll('[TOTAL]', totals.signup);
    this.explanation_div.html(`<p>${pay_text}</p>`);
    
    let due_total = totals.signup;
    if (totals.paid > 0) {
      due_total -= totals.paid;

      if (due_total <= 0) {
        this.explanation_div.append(`<p>${this.config.already_paid[lang]}</p>`);
        return;
      }
      
      let extra_text = this.config.payment_extra[lang];
      extra_text = extra_text.replaceAll('[PAIDTOTAL]', totals.paid);
      extra_text = extra_text.replaceAll('[DUETOTAL]', due_total);
      this.explanation_div.append(`<p>${extra_text}</p>`);
    }

    this.explanation_div.append(`<p>${this.config.explanation_text[lang]}</p>`);

    let pay_button = jQuery(`<button>${this.config.pay_button[lang]}</button>`);
    this.explanation_div.append(pay_button);
    pay_button.on('click', function() {
      FVSignupPayment.goto_payment();
    });
  }

  static payment_status_response(status) {
    let lang = FVSignup.get_lang();
    
    let run_spinner = false;
    switch (status) {
      case 'pending':
        setTimeout(function() {
          FVSignupPayment.check_payment_status()
        }, 2000);
        run_spinner = true;
        break;
      case 'cancelled':
        this.explanation_div.html(this.config.cancel_text[lang]);
        break;
      case 'confirmed':
        this.explanation_div.html(this.config.confirm_text[lang]);
        break;
      case 'failed':
        this.explanation_div.html(this.config.fail_text[lang]);
        break;
      default:
        FVSignup.com_error();
    }

    if (run_spinner && this.interval_id == undefined) {
      this.interval_id = setInterval(function() {
        FVSignupPayment.animate_spinner()          
      }, 33);
      this.spinner.show();
    }

    if (!run_spinner && this.interval_id != undefined) {
      clearInterval(this.interval_id);
      this.spinner.hide();
    }
  }

  static animate_spinner() {
    this.spinner_position ??= 0;

    this.spinner_position++;
    this.spinner_position %= 30;

    this.spinner.css('transform', `translate(${30*this.spinner_position}%)`);
  }
}