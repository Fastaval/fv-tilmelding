"using strict";

class FVSignupModuleSubmit {
  static element;
  static config;

  static init(element, callback) {
    this.element = jQuery('<div id="submit_module"></div>');
    element.append(this.element);

    this.element.append('<input type="hidden" id="hash">');
    this.element.append('<input type="hidden" id="id">');
    this.element.append('<input type="hidden" id="pass">');

    this.status = jQuery('<div class="status"></div>');
    this.element.append(this.status);

    this.errors = jQuery('<div class="errors"></div>');
    this.element.append(this.errors);

    this.signup_data = jQuery('<div class="signup-data"></div>');
    this.element.append(this.signup_data);

    FVSignupLogic.add_listener('page_confirm', function() {FVSignupModuleSubmit.on_page();});
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/config/submit",
      success: function (config) {
        FVSignupModuleSubmit.config = config;
        FVSignupModuleSubmit.config.loaded = true;
        FVSignupModuleSubmit.render_confirm();
        callback();
      }
    }).fail(function () {
        FVSignup.com_error();
    });
  }

  static render_confirm() {
    let lang = FVSignup.get_lang();
    
    this.confirm_page = jQuery('<div class="confirm-page"></div>');
    this.element.append(this.confirm_page);

    let text = this.config.confirmationpage[lang];
    this.confirm_page.append('<p>'+text+'</p>');
  }

  static get_info() {
    // Set id and pass if we have them
    let id = parseInt(this.element.find('input#id').val());
    let pass = this.element.find('input#pass').val();
    if (id && !isNaN(id) && pass) {
      return {
        id: id,
        pass: pass,
      }
    }
    return undefined;
  }

  static on_page() {
    this.status.empty();
    this.errors.empty();
    this.signup_data.empty();
    this.confirm_page.hide();

    if (FVSignupLogic.missing_pages().length == 0) {
      let text = {
        en: 'Processing your submission',
        da: 'Behandler din tilmelding',
      }
      this.status.append('<p>'+text[FVSignup.get_lang()]+'</p>');
    } else {
      let text = {
        en: 'Waiting for all pages to load',
        da: 'Venter på at alle sider er hentet',
      }
      this.status.append('<p>'+text[FVSignup.get_lang()]+'</p>');
      FVSignupLogic.add_listener('all_loaded', function() {
        if (FVSignupLogic.current_page == 'confirm') {
          FVSignupModuleSubmit.on_page();
        }
      });
      return;
    }

    let submission = {};
    let errors = {
      total: 0,
    };
    
    // Collect data and check for errors
    for(const key of FVSignup.page_keys) {
      if(key == 'confirm') continue; // Don't send data from the confirm page

      submission[key] = {};
      errors[key] = FVSignupLogic.check_page(key);
      errors.total += errors[key].length;
      if(errors.total != 0) continue; // No need to collect data if we have errors

      // Collect data from inputs
      let inputs = jQuery('div#'+key+' input, div#'+key+' textarea');
      inputs = inputs.not('[type="radio"]'); // Radio buttons are tracked with hidden inputs
      for(const input of inputs) {
        if(
          input.value != "" 
          && parseInt(input.value) != 0 
          && (input.type != 'checkbox' || input.checked == true)
          && !input.attributes['no-submit']
        ) {
          submission[key][input.id] = input.value;
        }
      }
    }

    if (errors.total != 0) {
      this.status.empty();
      this.render_errors(errors);
      return;
    }
    //console.log('Submission: ', submission);

    let data = {
      signup: submission,
      info: this.get_info(),
      lang: FVSignup.get_lang(),
    }

    jQuery.ajax({
      type: "POST",
      dataType: "json",
      url: FVSignup.get_infosys_url()+"/api/signup/submit",
      data: data,
      success: function (response) {
        FVSignupModuleSubmit.submit_success(response);
      },
      error: function(request, status, error) {
        //console.log(request);
        if (request.responseJSON) {
          FVSignupModuleSubmit.render_errors(request.responseJSON.result.errors);
          FVSignupModuleSubmit.signup_data.empty();
        } else {
          FVSignup.com_error();
        }
      }
    })
  }

  static submit_success(response) {
    this.status.empty();
    if (response.result.errors.length > 0) {
      this.render_errors(response.result.errors);
    } else {
      this.errors.empty();
    }
    let hash = this.element.find('input#hash');
    hash.val(response.hash);
    hash.change();
    this.render_submit(response.result.categories, response.result.total);
  }

  static render_errors(errors) {
    let lang = FVSignup.get_lang();
    this.errors.empty();
    this.errors.show();
    let text = {
      en: 'There are the following issues with your submission',
      da: 'Der er følgende problemer med din indtastning'
    };
    this.errors.append('<p>'+text[lang]+'</p>');
    
    for (const page_key of FVSignup.page_keys) {
      if (!errors[page_key] || errors[page_key].length == 0) continue;
      let page = FVSignup.get_page(page_key);
      let page_header = jQuery('<h3>'+page.title[lang]+'</h3>');
      this.errors.append(page_header);
      let table = jQuery('<table></table>');
      this.errors.append(table);
      let tbody = jQuery('<tbody></tbody>');
      table.append(tbody);
      for(const error of errors[page_key]) {
        let msg = FVSignupLogic.find_error(error.id, error.type).text();
        if(msg) {
          let id = error.id.replaceAll(':', '\\:');
          let label = jQuery('label[for='+id+']').text().replace(':','');
          tbody.append('<tr><td>'+label+'</td><td>'+msg+'</td></tr>');
        } else {
          console.log(error);
        }
      }
    }
  }

  static render_submit(categories, grand_total) {
    console.log(categories);
    let lang = FVSignup.get_lang();
    this.signup_data.empty();
    this.signup_data.show();
    
    let totals = [];

    for (const page_key of FVSignup.page_keys) {
      if (!categories[page_key] || categories[page_key].length == 0) continue;
      let page = FVSignup.get_page(page_key);
      let page_header = jQuery('<h3>'+page.title[lang]+'</h3>');
      this.signup_data.append(page_header);
      let table = jQuery('<table></table>');
      this.signup_data.append(table);
      let tbody = jQuery('<tbody></tbody>');
      table.append(tbody);
      for(const entry of categories[page_key]) {
        let input = FVSignup.get_input(entry.key);
        let text;
        let value = entry.value
        if (input.attr('type') == 'hidden') {
          let wrapper = input.closest('.input-wrapper');
          if(wrapper.hasClass('activity-choice')) {
            let activity_row = wrapper.closest('.activity-row').prev();
            text = activity_row.find('.title-wrapper').text();
            let day = activity_row.closest('table').attr('activity-day');
            text += " - "+FVSignup.uc_first(FVSignup.get_weekday(day))+" ";
            let time = new Date(parseInt(wrapper.attr('run-start'))*1000);
            text += (time.getHours()+"").padStart(2, '0')+":"+(time.getMinutes()+"").padStart(2, '0');
            let choices = FVSignupLogicActivities.activity_info.choices;
            if (entry.value <= choices.prio[lang].length) {
              value = choices.prio[lang][entry.value-1];
            } else {
              let type = wrapper.attr('activity-type');
              value = choices.gm[type] ? choices.gm[type][lang] : choices.gm.default[lang];

              let index = entry.value - choices.prio[lang].length;
              if (index > 1) {
                value += " "+choices.prio[lang][index-2];
              }
            }
          } else if(wrapper.hasClass('wear-item')){
            text = wrapper.find('p').text();
            if (entry.size != 1) {
              text += ", "+FVSignupModuleWear.wear_info.sizes[entry.size].name[lang];
            }
            value = entry.amount+" stk";
            if(entry.price) value += " = "+(entry.amount*entry.price)+" kr.";
          } else if(wrapper.hasClass('input-type-hidden')){
            text = input.attr('text');
          } else {
            text = wrapper.find('p').text();
            let option = wrapper.find('input[value='+value+'][name="'+entry.key+'"]');
            value = jQuery('label[for='+option.attr('id').replaceAll(':', '\\:')+']').text();
          }
        } else {
          if (this.config.short_text[entry.key]) {
            text = this.config.short_text[entry.key][lang];
          } else {
            let id = entry.key.replaceAll(':', '\\:');
            text = jQuery('label[for='+id+']').text().replace(':','');
          }
        }
        if (entry.price) {
          if(entry.value == 'on') {
            value = entry.price+" kr.";
          } else {
            text += ` (${entry.price} kr.)`
          }
        }
        if (value == 'on') {
          let value_text = {
            en: 'Yes',
            da: 'Ja',
          }
          value = value_text[lang];
        }
        if (entry.key == 'sub_total') {
          if (entry.value == 0) continue;
          value = entry.value + " kr.";
          text = FVSignup.config.sub_total[lang];
          totals.push({
            name: page.title[lang],
            value: value,
          })
        }
        tbody.append('<tr><td>'+text+'</td><td>'+value+'</td></tr>');
      }
    }
    
    // Total
    let total_header = jQuery('<h3>Total</h3>');
    this.signup_data.append(total_header);
    let table = jQuery('<table></table>');
    this.signup_data.append(table);
    let tbody = jQuery('<tbody></tbody>');
    table.append(tbody);
    for(const total of totals) {
      tbody.append('<tr><td>'+total.name+':</td><td>'+total.value+'</td></tr>');
    }
    tbody.append('<tr><td>Total:</td><td>'+grand_total+' kr.</td></tr>');

    // Submit
    let confirm_button = jQuery('<button>Confirm</button>');
    confirm_button.click(function() {
      FVSignupModuleSubmit.confirm();
    });
    this.signup_data.append(confirm_button);
  }

  static confirm() {
    let data = {
      hash: this.element.find('input#hash').val(),
      info: this.get_info(),
      lang: FVSignup.get_lang(),
    };

    jQuery.ajax({
      type: "POST",
      dataType: "json",
      url: FVSignup.get_infosys_url()+"/api/signup/confirm",
      data: data,
      success: function (response) {
        FVSignupModuleSubmit.confirm_success(response);
      },
      error: function(request, status, error) {
        //console.log(request);
        if (request.responseJSON) {
          FVSignupModuleSubmit.status.empty();
          FVSignupModuleSubmit.render_errors(request.responseJSON.result.errors);
        } else {
          FVSignup.com_error();
        }
      }
    })

    let lang = FVSignup.get_lang();
    let text = jQuery('<p>'+this.config.submit_text[lang]+'</p>');
    this.status.append(text.clone());
    this.signup_data.append(text);
  }

  static confirm_success(response) {
    this.status.empty();
    if (response.result.errors.length > 0) {
      this.render_errors(response.result.errors);
    } else {
      this.errors.empty();
    }
    this.signup_data.hide();
    let id = this.element.find('input#id');
    id.val(response.info.id);
    id.change();
    let pass = this.element.find('input#pass');
    pass.val(response.info.pass);
    pass.change();
    this.confirm_page.show();
  }
}