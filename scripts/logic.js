"using strict";

class FVSignupLogic {
  static current_page = null;
  static page_status = {};
  static listeners = {};

  static add_listener(name, callback) {
    if (this.listeners[name] == undefined) {
      this.listeners[name] = [];
    }
    this.listeners[name].push(callback);
  }

  static fire(name) {
    if (this.listeners[name] == undefined) return;
    for(const callback of this.listeners[name]) {
      callback();
    }
  }

  static require_config(callback) {
    if (FVSignup.config && FVSignup.config.loaded == true) {
      callback();
    } else {
      this.add_listener('config_ready', callback);
    }
  }

  static page_list(pages) {
    for(const key in pages) {
      this.page_status[key] = 'known';
    }
  }

  static is_page_disabled(key) {
    return this.page_status[key] == 'disabled';
  }

  static nav_click(key) {
    if (this.is_page_disabled(key)) return;

    // Check for errors before navigating
    let current = this.current_page;
    let errors = this.check_page(current);
    if (errors.length != 0) {
      let lang = FVSignup.get_lang();
      if (confirm(FVSignup.config.input_error[lang])) {
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
    window.history.pushState({page:key},"", FVSignup.get_base_url()+key+"/");

    // Fire listeners
    this.fire('page_'+key);
  }

  static next() { this.navigate('next'); }
  static prev() { this.navigate('prev'); }

  static navigate(direction) {
    let navto = FVSignup.main_content.find('nav div.selected');
    
    do {
      if (direction == 'prev') {
        navto = navto.prev();
      } else {
        navto = navto.next();
      }
    } while (navto.hasClass('disabled'))
    
    if (navto.length == 0) return;
    this.nav_click(navto.attr('page-id'));
  }

  static refresh_page() {
    this.fire('page_'+this.current_page);
  }

  static page_ready(key) {
    // Load data from storage for page
    // FVSignupStorage.page_loaded(key);

    let page = FVSignup.get_page(key);

    // Open the first page when it's ready (unless we seleted another already)
    if (this.current_page == null && (key == FVSignup.get_start_page() || ( FVSignup.get_start_page() == null && page.order == 1))) {
      FVSignup.main_content.find('nav div[page-id="'+key+'"]').addClass('selected');
      FVSignup.page_wrapper.find('div#'+key).show();
      this.current_page = key;

      // Fire listeners
      this.fire('page_'+key);
    }

    // Mark page status
    let logic = FVSignup.get_page(key).display_logic;
    if (logic && logic.default == 'disabled') {
      this.page_status[key] = 'disabled';
    } else {
      this.page_status[key] = 'ready';
    }

    // Check if all pages are done
    let waiting = this.missing_pages();
    if (waiting.length == 0) {
      this.all_loaded();
    }
  }

  static missing_pages() {
    return Object.values(this.page_status).filter(function(value) {
      // Return true if page is missing
      return !(value == 'ready' || value == 'disabled');
    })
  }

  static all_loaded() {
    this.init_radio_logic();
    for(const page_id of FVSignup.page_keys) {
      let page = FVSignup.get_page(page_id);
      this.init_display_logic({ page: page_id}, page);
      
      if (!Array.isArray(page.sections)) continue;
      for (const [index, section] of page.sections.entries()) {
        this.init_display_logic( { page: page_id, section: index}, section);
        for (const item of section.items ?? []) {
          this.init_item_logic(item);

          if (!Array.isArray(item.options)) continue;
          for (const [index, option] of item.options.entries()) {
            this.init_display_logic({input: `${item.infosys_id}-${index}`}, option);
          }
        }
      }
    }
    this.fire('all_loaded');
  }

  static init_radio_logic() {
    jQuery('input[type="radio"]').change(function (evt){
      let radio = jQuery(evt.target);
      let wrapper = radio.closest('.input-wrapper.input-type-radio');
      let hidden = wrapper.find('input#'+radio.attr('name').replaceAll(':', '\\:'));
      hidden.val(radio.val());
      hidden.change();
    });
  }

  static init_display_logic(item_id, item) {
    let logic = item.display_logic;
    if(!logic) return;

    for(const rule of logic) {
      let input = rule.input;
      if (rule.type == "age") {
        input = "birthdate";
      }

      if (!input) continue;

      // Update page status when an input that's part of the rule changes
      FVSignup.get_input(input).change(function() {
        FVSignupLogic.update_display_status(item_id, logic);
      });
    }

    this.update_display_status(item_id, logic);
  }

  static update_display_status(item_id, logic) {

    let status = "normal";
    for(const rule of logic) {
      status = this.check_rule(rule, status);
    }

    this.set_display_status(item_id, status);
  }

  static check_rule(rule, status = false) {
    rule.status = rule.status ?? true;
    let input = rule.input ? FVSignup.get_input(rule.input) : undefined;
    let compare_value;

    switch(rule.type) {
      case 'default':
        return rule.status;
      
      case 'field_compare':
        compare_value = input.val();           
        break;

      case 'checkbox':
        return input.prop('checked') ? rule.status : status;

      case 'age':
        compare_value = FVSignup.get_age();
        break;

      default:
        console.error("Rule Logic, Unknown rule type", "Rule:", rule);
    }

    if (rule.compare) {
      switch (rule.compare) {
        case 'equals':
          return compare_value == rule.value ? rule.status : status;

        case 'not_equals':
          return compare_value != rule.value ? rule.status : status;

        case 'greater': 
          return compare_value > rule.value ? rule.status : status;

        case 'less': 
          return compare_value < rule.value ? rule.status : status;

        default:
          console.error("Rule Logic, Unknown comparisson", "Rule:", rule);
      }
    }
    return null;
  }

  static set_display_status(item_id, status) {
    // Check if item is an input
    if(item_id.input) {
      let input = FVSignup.get_input(item_id.input);
      let wrapper = input.closest('.input-wrapper');

      if (status === "hidden") {
        input.hide();
        wrapper.hide();
      } else {
        input.show();
        wrapper.show();
      }
      
      if (status === "disabled" || status == "hidden") {
        input.attr('disabled', 'true');
        wrapper.addClass('disabled');
      } else {
        input.removeAttr('disabled');
        wrapper.removeClass('disabled');
      }

      if (status === "required") {
        wrapper.addClass('required');
      } else {
        wrapper.removeClass('required');
      }

      return;
    }

    // If item isn't an input, we need a page
    if (!item_id.page) return;
    
    let page_div = FVSignup.page_wrapper.find('#'+item_id.page);
    if(page_div.length !== 1) {
      console.error("Display status, wrong or ambiguous page ID", "ID:", item_id, "Status:", status);
      return;
    }

    // Check if we have a section
    if (item_id.section) {
      let section_div = jQuery(page_div.find('.section-wrapper')[item_id.section]);
  
      status === "hidden" ? section_div.hide() : section_div.show();
  
      let inputs = section_div.find('input');
      if (status === "disabled") {
        section_div.addClass('disabled');
      } else {
        section_div.removeClass('disabled');
      }

      if (status == "normal") {
        inputs.each(function() {
          // only enable inputs that haven't been individually disabled
          let wrapper = jQuery(this).closest('.input-wrapper');
          if (!wrapper.hasClass('disabled')) jQuery(this).removeAttr('disabled');
        })
      } else {
        inputs.attr('disabled', 'true');
      }
      return;
    }

    // There was no section specified, so status relates to whole page
    let nav_button = FVSignup.navigation.find('[page-id="'+item_id.page+'"]');
    if (status == "normal") {
      nav_button.removeClass('disabled');
      page_div.removeClass('disabled');
      this.page_status[item_id.page] = 'ready';
    } else {
      nav_button.addClass('disabled');
      page_div.addClass('disabled');
      this.page_status[item_id.page] = 'disabled';
    }
  }

  /**
   * Logic for excluding other choices
   */
  static init_item_logic(item) {
    if (!item.infosys_id) return;

    this.init_display_logic({input: item.infosys_id}, item);

    let input = FVSignup.get_input(item.infosys_id);
    if (item.excludes) this.init_exclude_item(item, input);

    if (item.autocomplete) this.init_autocomplete(item, input);
  }

  static init_exclude_item(item, input) {
    if(input.attr('type') == 'checkbox') {
      input.click(function() {
        if (input.prop('checked')) {
          for(const exclude of item.excludes) {
            FVSignup.get_input(exclude).prop('checked', false);
          }
        }
      });
    } else {
      console.error('Unsupported input type for exclude', item);
    }
  }

  static init_autocomplete(item, input) {
    let lang = FVSignup.get_lang();
    let wrapper = input.closest('.input-wrapper');
    let list_element = wrapper.find('.autocomplete-list').hide();
    let option_value = item.autocomplete.value;

    let list = FVSignup.config.autocomplete[item.autocomplete.list];
    list = Object.values(list);
    list.sort(function (a, b) {
      if (a[lang] === b[lang]) return 0;
      return a[lang] > b[lang] ? 1 : -1;
    });


    let text_input = input;
    if (item.autocomplete.mode === 'exhaustive') {
      text_input = wrapper.find('input[type=text]');
    }

    text_input.focusout(function(evt) {
      list_element.hide();
    });

    text_input.on('input', function() {
      list_element.empty();
      
      let value = text_input.val();
      for(const option of list) {
        let text = option[lang].toLowerCase();
        if (text.includes(value.toLowerCase())) {
          let option_element = jQuery(`<p class="auto-option">${option[lang]}</p>`);
          if (option_value) option_element.attr('value', option[option_value]);
          list_element.append(option_element);
        }
      }
      
      // Init logic on each list element
      let options = list_element.find('p');
      if (options.length == 0) {
        list_element.append(`<p>${FVSignup.config.errors.no_match[lang]}</p>`);
      }

      options.first().addClass('selected');

      options.mouseenter(function(evt) {
        jQuery(evt.delegateTarget).addClass('selected');
      });
      options.mouseleave(function(evt) {
        jQuery(evt.delegateTarget).removeClass('selected');
      });
      options.mousedown(function(evt) {
        FVSignupLogic.select_auto_option(jQuery(evt.delegateTarget));
      });

      // Position and display the list
      list_element.css({
        top: text_input.position().top + text_input.outerHeight(),
        left: text_input.position().left,
      })
      list_element.show();
    })

    text_input.keydown(function(evt) {
      let selected = list_element.find('.selected');
      if (evt.key == 'Enter') {
        evt.preventDefault();
        if (selected.length == 0) return;
        FVSignupLogic.select_auto_option(selected);
      }

      selected.removeClass('selected');
      if (evt.key == 'ArrowUp') {
        evt.preventDefault();
        selected = selected.prev();
        if (selected.length == 0) {
          selected = list_element.find('.auto-option').last();
        }
      }

      if (evt.key == 'ArrowDown') {
        evt.preventDefault();
        selected = selected.next();
        if (selected.length == 0) {
          selected = list_element.find('.auto-option').first();
        }
      }

      selected.addClass('selected');
    })
  }

  static select_auto_option(option) {
    let wrapper = option.closest('.input-wrapper');
    let text_input = wrapper.find('input[type=text]');
    let hidden = wrapper.find('input[type=hidden]');

    // Set values needed
    text_input.val(option.text());
    if (hidden.length > 0) {
      hidden.val(option.attr('value'))
    }

    // Clear the selection list
    wrapper.find('.autocomplete-list').hide().empty();
  }

  // TODO
  // Wear for junior
  // Mobil must be number
  static check_page(page_id) {
    let page = FVSignup.get_page(page_id);
    let errors = [];
    if(!page.sections) return errors;
    for(const section of page.sections) {
      
      // Check for module errors
      if (section.module) {
        let module = FVSignup.get_module(section.module);
        if (module.check_errors) {
          errors = errors.concat(module.check_errors());
        } 
      }

      // Check section errors
      let con_req_one = false; // Condinitional require one
      if (section.require_one_if) {
        con_req_one = this.check_rule(section.require_one_if)
      }

      if (section.require_one || con_req_one) {
        let missing = true;
        let required = section.require_one ?? section.require_one_if.required;
        required.every(function(id) {
          let input = FVSignup.get_input(id);
          if (input.attr('type') == 'checkbox') {
            if (input.prop('checked')) {
              missing = false;
              return false;
            }
          } else {
            if (input.val() !== '') {
              missing = false;
              return false;
            }
          }
          return true;
        });

        if (missing) {
          errors.push({
            id: section.section_id,
            type: 'require_one',
          });
        }
      }

      // Check input errors
      if(!section.items) continue;
      for(const item of section.items) {
        if(!item.infosys_id) continue;

        let input = FVSignup.get_input(item.infosys_id);
        if (input.attr('disabled')) continue;

        // Conditional required - like Alea for organizers
        let con_req = false;
        if (item.required_if) {
          if(!Array.isArray(item.required_if)) {
            item.required_if = [item.required_if];
          }
          for (const rule of item.required_if.values()) {
            con_req = this.check_rule(rule, con_req);
          }
        }
        // Required input
        if (item.required || con_req) {
          let status = item.type == 'checkbox' ? input.prop('checked') : input.val();
          if (!status) {
            errors.push({
              id: item.infosys_id,
              type: 'required',
            });
          }
        }
        // Matching input like Email confirm
        if (item.equals) {
          let compare = FVSignup.get_input(item.equals);
          if (input.val() != compare.val()) {
            errors.push({
              id: item.infosys_id,
              type: 'match',
            });
          }
        }
        // Exclusive picks like entry partout and entry single days
        if (item.excludes) {
          let enabled = false;
          switch (item.type) {
            case 'checkbox':
              enabled = input.prop('checked');
              break;

            default:
              errors.push({
                id: item.infosys_id,
                type: 'exclude_unsupported_type',
                input_type: item.type,
              });
          }
          // Only check for exclusive if input is enabled 
          if(enabled) {
            for(const exclude of item.excludes) {
              let other = FVSignup.get_input(exclude);
              if (other.attr('type') == 'checkbox') {
                if (other.prop('checked')) {
                  errors.push({
                    id: item.infosys_id,
                    type: 'excludes',
                    other: exclude,
                  });
                }
                continue;
              }
              errors.push({
                id: item.infosys_id,
                type: 'exclude_unsupported_other_type',
                other_id: exclude,
                other: other,
              });
            }
          }
        }
        if (item.autocomplete && item.autocomplete.mode == "exhaustive") {
          let list = FVSignup.config.autocomplete[item.autocomplete.list];
          let lang = FVSignup.get_lang();
          let input_text = input.closest('.input-wrapper').find('input[type=text]');

          let match = false;
          for(const option of Object.values(list)) {
            let text = option[lang].toLowerCase();
            if (text == input_text.val().toLowerCase()) {
              match = true;
              input.val(option[item.autocomplete.value]);
              break;
            }
          }
    
          if (!match) {
            errors.push({
              id: item.infosys_id,
              type: 'not_on_list',
            });
          }
        }
      }
    }
    this.mark_errors(page_id, errors);
    return errors;
  }

  static mark_errors(page_id, errors) {
    let nav_button = FVSignup.main_content.find('nav div[page-id="'+page_id+'"]');
    let page_div = FVSignup.get_page_div(page_id);

    // Remove existing error markings
    let items = page_div.find('.error');
    items.find('.error-text').hide();
    items.removeClass('error');

    // Remove error marking nav button
    if (errors.length == 0) {
      nav_button.removeClass('error');
      return;
    }

    // Add error markings
    nav_button.addClass('error');
    for (const error of errors) {
      this.find_error(error.id, error.type).show();
    }
  }

  static find_error(id, type) {
    let wrapper;
    if (type == 'require_one') {
      wrapper = FVSignup.main_content.find('.section-wrapper#page-section-'+id);
    } else {
      wrapper = FVSignup.get_input(id).closest('.input-wrapper');
    }
    
    wrapper.addClass('error');
    let error = wrapper.find('.error-text[error-type='+type+']');
    if (error.length == 0) console.log('No error text ID: ', id, ' Type: ', type);
    return error;
  }
}