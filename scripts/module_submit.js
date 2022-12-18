"using strict";

class FVSignupModuleSubmit {
  static element;
  static config;
  static page_header;

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

    this.page_header = element.closest('.signup-page').find('h2').first();

    FVSignupLogic.add_listener('page_confirm', function() {FVSignupModuleSubmit.on_page();});
    FVSignup.load_config('submit', function (config) {
      FVSignupModuleSubmit.config = config;
      FVSignupModuleSubmit.config.loaded = true;
      FVSignupModuleSubmit.render_confirm();
      callback();
    });
  }

  static render_confirm() {
    let lang = FVSignup.get_lang();
    
    this.confirm_page = jQuery('<div class="confirm-page"></div>');
    this.element.append(this.confirm_page);

    let text = this.config.confirmationpage[lang];
    text = text.replaceAll('[ID]', '<span id="display-id"></span>');
    text = text.replaceAll('[TOTAL]', '<span id="display-total"></span>');
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

  static set_info(id, pass) {
    this.element.find('input#id').val(id);
    this.element.find('input#pass').val(pass);
  }

  static on_page() {
    this.status.empty();
    this.errors.empty();
    this.signup_data.empty();
    this.confirm_page.hide();
    this.page_header.show();

    if (FVSignupLogic.missing_pages().length == 0) {
      let text = this.config.processing_text;
      this.status.append('<p>'+text[FVSignup.get_lang()]+'</p>');
    } else {
      let text = this.config.waiting_for_pages
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
      if(FVSignupLogic.is_page_disabled(key)) continue;

      submission[key] = {};
      errors[key] = FVSignupLogic.check_page(key);
      errors.total += errors[key].length;
      if(errors.total != 0) continue; // No need to collect data if we have errors

      // Collect data from inputs
      let inputs = jQuery('div#'+key+' input, div#'+key+' textarea');
      inputs = inputs.not('[type="radio"]'); // Radio buttons are tracked with hidden inputs

      // Deal with special modules
      let module_div = jQuery(`div#${key} .special-submit`);
      module_div.each(function() {
        // Don't handle inputs inside the module
        inputs = inputs.not(`#${this.id} *`);

        // Get the submission from the module
        let module_id = jQuery(this).attr('module');
        let module = FVSignup.get_module(module_id)
        if(module) module.get_submission(submission[key]);
      })

      for(const input of inputs) {
        // Ignore "no-submit" and disabled inputs
        if (input.attributes['no-submit'] || input.attributes['disabled']) continue;

        // Submit checkbox
        if (input.type == 'checkbox' ) {
          submission[key][input.id] = input.checked ? input.value : 'off';
          continue;
        }

        // Check if input is empty and whether we need to submit it anyway
        let no_empty = input.attributes['no-submit-empty'];
        if(no_empty && no_empty.value == 'true' && (input.value == "" || parseInt(input.value) === 0)) continue;

        submission[key][input.id] = input.value;
      }
    }

    if (errors.total != 0) {
      this.status.empty();
      this.render_errors(errors);
      return;
    }

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
    let text = this.config.error_text;
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
        let msg;
        if (error.module) {
          let module = FVSignup.get_module(error.module);
          if (module.get_error_msg) msg = module.get_error_msg(error);
        } else if (error.id) {
          msg = FVSignupLogic.find_error(error.id, error.type).text();
        } 

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

        if (entry.special_module) {
          [text, value] = FVSignup.get_module(entry.special_module).get_confirm(entry);
        } else if (input.attr('type') == 'hidden') {
          let wrapper = input.closest('.input-wrapper');
          if(wrapper.hasClass('activity-choice')) {
            let activity_row = wrapper.closest('.activity-row').prev();
            text = activity_row.find('.title-wrapper').text();
            let day = activity_row.closest('table').attr('activity-day');
            text += " - "+FVSignup.uc_first(FVSignup.get_weekday(day))+" ";
            let time = new Date(parseInt(wrapper.attr('run-start'))*1000);
            text += (time.getHours()+"").padStart(2, '0')+":"+(time.getMinutes()+"").padStart(2, '0');
            let choices = FVSignupLogicActivities.config.choices;
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
          } else if(wrapper.hasClass('input-type-hidden')){
            text = input.attr('text');
          } else {
            text = wrapper.find('p').text();
            let option = wrapper.find('input[value='+value+'][name="'+entry.key+'"]');
            value = jQuery('label[for='+option.attr('id').replaceAll(':', '\\:')+']').text();
          }
        } else if (input.attr('submit-text')) {
          text = input.attr('submit-text');
        }else {
          if (this.config.short_text[entry.key]) {
            text = this.config.short_text[entry.key][lang];
          } else {
            let id = entry.key.replaceAll(':', '\\:');
            text = jQuery('label[for='+id+']').text().replace(':','');
          }
        }

        // Extra stuff for special values and summing totals
        if (entry.price) {
          if(entry.value == 'on') {
            value = entry.price+" "+FVSignup.config.dkk[lang];
          } else {
            if (entry.single_price) {
              text += ` (${entry.single_price} ${FVSignup.config.dkk[lang]})`
            } else {
              text += ` (${entry.price} ${FVSignup.config.dkk[lang]})`
            }
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
          value = entry.value + " "+FVSignup.config.dkk[lang];
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
    tbody.append('<tr><td>Total:</td><td>'+grand_total+' '+FVSignup.config.dkk[lang]+'</td></tr>');

    // Submit
    let button_text = this.config.button_text;
    let confirm_button = jQuery('<button id="confirm-submission-button">'+button_text[lang]+'</button>');
    confirm_button.click(function() {
      FVSignupModuleSubmit.confirm();
    });
    this.signup_data.append(confirm_button);
  }

  static confirm() {
    let button = jQuery('#confirm-submission-button');
    button.prop('disabled', true);
    
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
    }).always(function () {
      button.prop('disabled', false);
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
    this.confirm_page.find('#display-id').text(response.info.id);
    this.confirm_page.find('#display-total').text(response.result.total);
    this.confirm_page.show();
    this.page_header.hide();
  }
}

FVSignup.register_module('submit', FVSignupModuleSubmit);