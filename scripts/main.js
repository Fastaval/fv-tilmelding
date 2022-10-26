"using strict";

var fv_signup_settings;

jQuery(function() {
  FVSignup.init();
});

class FVSignup {
  static config;
  static page_keys;
  static pages = {};
  
  static main_content;
  static navigation;
  static storage_controls;
  static page_wrapper;

  static init () {
    let placeholder = jQuery(".signup-placeholder");
    placeholder.remove();

    this.main_content = jQuery(".post-content");
    this.main_content.append("<h1 id='signup-header'>Fastaval Tilmelding</h1>");

    this.navigation = jQuery("<nav id='signup-navigation'></nav>");
    this.main_content.append(this.navigation);
    
    this.storage_controls = jQuery('<div id="storage-controls"></div>');
    this.main_content.append(this.storage_controls);

    this.page_wrapper = jQuery("<div id='signup-pages'></div>");
    this.main_content.append(this.page_wrapper);

    jQuery(window).on('popstate', function(evt) {
      FVSignupLogic.nav_click(evt.originalEvent.state.page);
    });

    for (const key in fv_signup_settings) {
      this['get_'+ key] = function() {
        return fv_signup_settings[key];
      }
    }

    this.load_config('main', function (config) {
      FVSignup.config = config;
      FVSignup.config.loaded = true;
      FVSignupLogic.fire('config_ready');
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

    // Render navigation
    FVSignupRender.navigation(pages, this.page_keys, this.navigation);
    // Setup navigation functionality
    this.main_content.find("nav div").click((evt) => {
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
      en: "There was an error communicating with Infosys\nThis may be a temporary error and you're welcome to try again.\nIf the error persist, plaease contact admin@fastaval.dk",
      da: "Der skete en fejl i kommunikationen med Infosys\nDette kan være en midlertidig fejl og du er velkommen til at prøve igen.\nHvis fejlen fortsættter må du meget gerne kontakte admin@fastaval.dk"
    };
    alert(msg[this.get_lang()]);
  }

  static add_module(module, element, callback) {
    switch (module) {
      case "food":
        FVSignupModuleFood.init(element, callback);
        break;
    
      case "activities":
        FVSignupModuleActivities.init(element, callback);
        break;

      case "wear":
        FVSignupModuleWear.init(element, callback);
        break;

      case "submit":
        FVSignupModuleSubmit.init(element, callback);
        break;
          
  
      default:
        FVSignupRender.unknown_module(module, element);
        callback();
        break;
    }
  }

  static days = {
    en: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
    da: [
      'mandag',
      'tirsdag',
      'onsdag',
      'tordsag',
      'fredag',
      'lørdag',
      'søndag',
    ]
  };

  static get_weekday(day) {
    return this.days[fv_signup_settings.lang][day-1];
  }

  static get_input(id) {
    return jQuery('input#'+id.replaceAll(':','\\:'));
  }

  static get_age(date) {
    let birthdate = new Date(this.get_input(this.config.birth).val() + " 00:00:00");
    if(birthdate.toString() == 'Invalid Date') return 0;

    date = date ? date : new Date(this.config.con_start);

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
    if (this.get_input('entry:partout').prop('checked')) return true;
    return this.get_input('entry:'+day).prop('checked');
  }

  static uc_first(text) {
    return text.substr(0,1).toUpperCase() + text.substr(1);
  }
}