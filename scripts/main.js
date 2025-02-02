"using strict";

var fv_signup_settings;

jQuery(function() {
  FVSignup.init();
});

class FVSignup {
  static config;
  static page_keys;
  static pages = {};
  static modules = {};
  static last_page;
  
  static page_content;
  static signup_content;
  static navigation;
  static storage_controls;
  static page_wrapper;

  static show_signup() {
    let key = FVSignupLogic.current_page;
    window.history.pushState({page:key},"", FVSignup.get_base_url()+key+"/");

    this.page_content.children().each(function() {
      jQuery(this).hide();
    })

    if (this.signup_content == undefined) {
      this.load_signup();
    }

    this.signup_content.show();
  }

  static hide_all() {
    this.page_content.children().each(function () {
      jQuery(this).hide();
    })
  }

  static init () {
    let placeholder = jQuery(".signup-placeholder");
    placeholder.remove();

    this.page_content = jQuery(".page-content");
    
    jQuery(window).on('popstate', function(evt) {
      let page = evt.originalEvent.state.page;
      // if (page == 'payment') {
      //   FVSignupPayment.show_payment();
      //   return;  
      // }

      if (page == 'paynow') {
        FVSignupPayment.payment_redirect();
        return;
      }

      FVSignupLogic.nav_click(page);
    });

    // Add get method for all settings
    for (const key in fv_signup_settings) {
      this['get_'+ key] = function() {
        return fv_signup_settings[key];
      }
    }

    // if (fv_signup_settings.start_page == 'payment') {
    //   fv_signup_settings.start_page = null;
    //   FVSignupPayment.show_payment();
    //   return;
    // }

    if (fv_signup_settings.start_page == 'paynow') {
      fv_signup_settings.start_page = null;
      FVSignupPayment.init(function() {
        FVSignupPayment.payment_redirect();
      })
      return;
    }

    this.load_signup();
  }

  static load_signup() {
    this.signup_content = jQuery("<div id='signup-content'></div>");
    this.page_content.append(this.signup_content);

    this.navigation = jQuery("<nav id='signup-navigation'></nav>");
    this.signup_content.append(this.navigation);
    
    this.existing_controls = jQuery('<div id="existing-controls"></div>');
    this.signup_content.append(this.existing_controls);

    this.storage_controls = jQuery('<div id="storage-controls"></div>');
    this.signup_content.append(this.storage_controls);

    this.page_wrapper = jQuery("<div id='signup-pages'></div>");
    this.signup_content.append(this.page_wrapper);

    // this.signup_footer = jQuery(`<div id="signup-footer"></div>`);
    // this.signup_content.append(this.signup_footer);

    this.load_config('main', function (config) {
      FVSignup.config = config;
      FVSignup.config.loaded = true;
      FVSignupLogic.fire('config_ready');
      // FVSignupRender.signup_footer(FVSignup.signup_footer);
    });
    FVSignupStorage.init(this.storage_controls);
    this.load_page_list();
  }

  static load_config(name, success) {
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/config/"+name,
      success: function (config) {
        success(config);
      }
    }).fail(function () {
        FVSignup.com_error();
    });
  }

  static load_page_list () {
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/pagelist",
      success: function (pages) {
        FVSignup.parse_page_list(pages);
      }
    }).fail(function () {
        FVSignup.com_error();
    });
  }

  static parse_page_list(pages) {
    // Sort page keys by ordering
    let keys = Object.keys(pages);
    this.page_keys = keys.sort((a,b) => {
      return pages[a].order - pages[b].order;
    })

    FVSignupLogic.page_list(pages);

    // Mark the last 
    let max_order = 0;
    for (const key in pages) {
      if (pages[key].order > max_order) {
        max_order = pages[key].order;
        this.last_page = key;
      }
    }

    // Render navigation
    FVSignupRender.navigation(pages, this.page_keys, this.navigation);
    // Setup navigation functionality
    this.signup_content.find("nav div").click((evt) => {
      let key = evt.target.getAttribute("page-id");
      FVSignupLogic.nav_click(key);
    })
    // Fully load pages
    setTimeout( () => {this.load_pages(keys)});
  }

  static load_pages(keys) {
    keys.forEach( key => {
      this.load_page(key);
    })
  }
 
  static load_page(key) {
    let callback = function() {
      FVSignupLogic.page_ready(key);
    };

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/page/"+key,
      success: function (page) {
        FVSignup.pages[key] = page;
        FVSignupRender.page(page, key, FVSignup.page_wrapper, callback);
      }
    }).fail(function () {
        FVSignup.com_error();
    });
  }

  static com_error() {
    console.log('Com error:');
    console.trace();

    let msg = {
      en: "There was an error communicating with Infosys\nThis may be a temporary error and you're welcome to try again.\nIf the error persist, plaease contact it@fastaval.dk",
      da: "Der skete en fejl i kommunikationen med Infosys\nDette kan være en midlertidig fejl og du er velkommen til at prøve igen.\nHvis fejlen fortsættter må du meget gerne kontakte it@fastaval.dk"
    };
    alert(msg[this.get_lang()]);
  }

  static register_module(id, definition){
    this.modules[id] = definition;
  }

  static add_module(module, element, callback) {
    if (this.modules[module] == undefined) {
      FVSignupRender.unknown_module(module, element);
      callback();
    } else {
      this.modules[module].init(element, callback);
    }
  }

  static get_module(id) {
    return this.modules[id];
  }

  static days = {
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    da: ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']
  };

  static get_weekday(day) {
    return this.days[fv_signup_settings.lang][day-1];
  }

  static months = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    da: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
  };

  static get_month(month) {
    return this.months[fv_signup_settings.lang][month];
  }

  static get_ordinal(number) {
    if (fv_signup_settings.lang == 'da') return ".";

    if ((number % 100) >= 11 && (number % 100) <= 13) return "th";
    if (number % 10 == 1) return "st";
    if (number % 10 == 2) return "nd";
    if (number % 10 == 3) return "rd";
    return "th";
  }

  static get_input(id) {
    if (typeof id !== 'string') return jQuery('');

    id = id.replaceAll(':','\\:');
    return jQuery(`input#${id}, textarea#${id}, select#${id}`);
  }

  static get_base_url() {
    let prefix = fv_signup_settings.lang == 'en' ? '/en' : '';
    return prefix+fv_signup_settings.base;
  }

  static get_age(date) {
    let birthdate = new Date(this.get_input(this.config.birth).val().replace(/-/g, "/") + " 00:00:00");
    if(birthdate.toString() == 'Invalid Date') return 0;

    date = date ? date : new Date(this.config.con_start.replace(/-/g, "/"));

    // How many years ago?
    let age = date.getFullYear() - birthdate.getFullYear();
    // Did they have a birthday before the date?
    date.setFullYear(birthdate.getFullYear());
    if (birthdate > date) age--;

    return age;
  }

  static get_page(key) {
    return this.pages[key];
  }

  static get_page_div(key) {
    return this.page_wrapper.find('div.signup-page#'+key);
  }

  static attending_day(day) {
    if (this.get_input('participant').val() == 'Juniordeltager') {
      // Junior participants are always attending Saturday
      if (day == 4) return true;
      // Regular juinor participants are not attending any other days
      if (!this.get_input('junior:plus').prop('checked')) return false;
    }

    if (this.get_input('entry:partout').prop('checked')) return true;
    return this.get_input('entry:'+day).prop('checked');
  }

  static get_participant_type() {
    switch (this.get_input('participant').val()) {
      case 'Juniordeltager':
        let plus = this.get_input('junior:plus').prop('checked');
        return plus ? 'junior-plus' : 'junior';
      
      case 'Deltager':
        return 'deltager';

      case 'Arrangør':
        return 'organizer';

      default:
        console.error('Unknown participant type');
        return 'unknown';
    }
  }

  static uc_first(text) {
    return text.substr(0,1).toUpperCase() + text.substr(1);
  }
}