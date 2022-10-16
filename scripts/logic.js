"using strict";

class FVSignupLogic {
  static current_page = null;
  static page_status = {};
  static listeners = {
    page: {},
    all_loaded: [],
  };

  static page_list(pages) {
    for(const key in pages) {
      this.page_status[key] = 'known';
    }
  }

  static nav_click(key) {
    // Check for errors before navigating
    let current = this.current_page;
    let errors = this.check_page(current);
    if (errors.length != 0) {
      // TODO mark errors
      console.log(errors);
      let text = {
        en: "There some issues with the input on the current page.\nDo you still want to continue?",
        da: "Der er nogle problemer med indtastningen på den nuværende side.\nVil du fortsætte alligevel?",
      }
      if (!confirm(text[FVSignup.get_lang()])) {
        return;
      }
    }

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
    if(this.listeners.page[key]) {
      for(const callback of this.listeners.page[key]) {
        callback();
      }
    }
  }

  static next() { this.navigate('next'); }
  static prev() { this.navigate('prev'); }

  static navigate(direction) {
    let navto
    if (direction == 'prev') {
      navto = FVSignup.main_content.find('nav div.selected').prev();
    } else {
      navto = FVSignup.main_content.find('nav div.selected').next();
    }
    this.nav_click(navto.attr('page-id'));
  }

  static on_page(page, callback) {
    if (this.listeners.page[page] == undefined) {
      this.listeners.page[page] = [];
    }
    this.listeners.page[page].push(callback);
  }

  static on_all_loaded(page, callback) {
    this.listeners.all_loaded.push({
      callback: callback,
      page: page,
    });
  }

  static page_ready(page, key) {
    // Open the first page when it's ready (unless we seleted another already)
    if (this.current_page == null && (key == FVSignup.get_start_page() || ( FVSignup.get_start_page() == null && page.order == 1))) {
      FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');
      FVSignup.page_wrapper.find('div#'+key).show();
      this.current_page = key;

      // Trigger listeners
      if(this.listeners.page[key]) {
        for(const callback of this.listeners.page[key]) {
          callback();
        }
      }
    }

    // Mark page as ready and check if all pages are done
    this.page_status[key] = 'ready';
    let waiting = this.missing_pages();
    if (waiting.length == 0) {
      this.all_loaded();
    }
  }

  static missing_pages() {
    return Object.values(this.page_status).filter(function(value) {
      return value != 'ready';
    })
  }

  static all_loaded() {
    this.init_radio_logic();
    if (this.listeners.all_loaded.length != 0) {
      for(const listener of this.listeners.all_loaded) {
        if (this.current_page == listener.page) {
          listener.callback();
        }
      }
    }
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

  // GDPR logic
  // Antend days logic
  // Alea for organizers
  // Wear for junior
  // Mobil must be number
  static check_page(page_id) {
    let page = FVSignup.get_page(page_id);
    let errors = [];
    if(!page.sections) return errors;
    for(const section of page.sections) {
      if(!section.items) continue;
      for(const item of section.items) {
        // Required
        if (item.required) {
          let input = jQuery("#"+item.infosys_id);
          let status = item.type == 'checkbox' ? input.prop('checked') : input.val();
          if (!status) {
            errors.push({
              id: item.infosys_id,
              type: 'required',
            });
          }
        }
        // Email confirm
        if (item.equals) {
          let input = jQuery("#"+item.infosys_id);
          let compare = jQuery("#"+item.equals);
          if (input.val() != compare.val()) {
            errors.push({
              id: item.infosys_id,
              type: 'match',
            });
          }
        }
      }
    }
    return errors;
  }
}