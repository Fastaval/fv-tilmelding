"using strict";

var fv_signup_settings;

jQuery(function() {
  FVSignup.init();
});

class FVSignup {
  static config;

  static init () {
    let placeholder = jQuery(".signup-placeholder");
    placeholder.remove();

    this.main_content = jQuery(".post-content");
    this.main_content.append("<h1 id='signup-header'>Fastaval Tilmelding</h1>");

    this.navigation = jQuery("<nav id='signup-navigation'></nav>");
    this.main_content.append(this.navigation);
    
    this.page_wrapper = jQuery("<div id='signup-pages'></div>");
    this.main_content.append(this.page_wrapper);

    this.load_infosys_config();
    this.load_page_list();
  }

  static load_infosys_config () {
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/config",
      success: function (config) {
        FVSignup.config = config;
      }
    })
  }

  static load_page_list () {
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/pagelist",
      success: function (pages) {
        FVSignup.parse_page_list(pages);
      }
    })
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
    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/page/"+key,
      success: function (page) {
        FVSignupRender.page(page, key, FVSignup.page_wrapper);
        FVSignupLogic.page_ready(page, key);
      }
    })
  }

  static add_module(module, element) {
    switch (module) {
      case "food":
        FVSignupModuleFood.init(element);
        break;
    
      case "activities":
        FVSignupModuleActivities.init(element);
        break;

      default:
        FVSignupRender.unknown_module(module, element);
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
    return jQuery('input#'+id);
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
}