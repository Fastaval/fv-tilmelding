"using strict";

class FVSignupLogic {
  static current_page = null;
  static page_status = {};
  static page_listeners = {};

  static page_list(pages) {
    for(const key in pages) {
      this.page_status[key] = 'known';
    }
  }

  static nav_click(key) {
    // Move selection
    FVSignup.main_content.find('nav div.selected').removeClass('selected');
    FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');

    // Hide all pages
    FVSignup.page_wrapper.find('div.signup-page').hide();
    
    // Show current page
    FVSignup.page_wrapper.find('div#'+key).show();
    this.current_page = key;
    
    // Scroll to top
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('scroll')) // Reset top menu
    
    // Set addressbar
    window.history.pushState({page:key},"", FVSignup.get_base()+key+"/");

    // Trigger listeners
    if(this.page_listeners[key]) {
      for(const callback of this.page_listeners[key]) {
        callback();
      }
    }
  }

  static next() {
    let next = FVSignup.main_content.find('nav div.selected').next();
    this.nav_click(next.attr('page-id'));
  }

  static prev() {
    let prev = FVSignup.main_content.find('nav div.selected').prev();
    this.nav_click(prev.attr('page-id'));
  }

  static on_page(page, callback) {
    if (this.page_listeners[page] == undefined) {
      this.page_listeners[page] = [];
    }
    this.page_listeners[page].push(callback);
  }

  static page_ready(page, key) {
    // Open the first page when it's ready (unless we seleted another already)
    if (this.current_page == null && (key == FVSignup.get_page() || ( FVSignup.get_page() == null && page.order == 1))) {
      FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');
      FVSignup.page_wrapper.find('div#'+key).show();
      this.current_page = key;
    }

    // Mark page as ready and check if all pages are done
    this.page_status[key] = 'ready';
    let waiting = Object.values(this.page_status).filter(function(value) {
      return value != 'ready';
    })
    if (waiting.length == 0) {
      this.all_loaded();
    }
  }

  static all_loaded() {
    this.init_radio_logic();
  }

  static init_radio_logic() {
    jQuery('input[type="radio"]').change(function (evt){
      let radio = jQuery(evt.target);
      let wrapper = radio.closest('.input-wrapper.input-type-radio');
      let hidden = wrapper.find('input#'+radio.attr('name'));
      hidden.val(radio.val());
      hidden.change();
    });
  }
}