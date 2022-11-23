"using strict";

class FVSignupModuleWear {
  static config;
  static element;
  static wear_info;
  static wear_items = {};
  static order_list;

  static init(element, callback) {
    this.element = jQuery('<div id="wear_module"></div>');
    this.element.append('<p>Loading wear module</p>');
    element.append(this.element);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/wear",
      success: function (wear_info) {
        FVSignupModuleWear.wear_info = wear_info;
        if (FVSignupModuleWear.config) FVSignupModuleWear.render_wear();
      }
    }).fail(function () {
      FVSignup.com_error();
    }).always(function (){
      callback();
    });

    FVSignup.load_config('wear', function (config) {
      FVSignupModuleWear.config = config;
      if (FVSignupModuleWear.wear_info) FVSignupModuleWear.render_wear();
    });
  }

  static render_wear() {
    let lang = FVSignup.get_lang();
    this.element.empty();

    this.element.append(
      '<table id="wear-orders">' + 
        '<thead>' +
          '<tr><th>'+ this.config.order_header[lang]+'</th></tr>'+
        '</thead>' +
        '<tbody>' + 
          '<tr class="no-orders"><td>' + this.config.no_orders[lang] + '</td></tr>'+
        '</tbody>' +
      '</table>'
    );

    for(const wear of this.wear_info.wear) {
      this.wear_items[wear.id] = wear;

      //Create wear item wrapper
      let wear_div = jQuery('<div class="wear-item"></div>');
      wear_div.attr('id', 'wear-item-'+wear.id);
      wear_div.attr('wear-id', wear.id);
      this.element.append(wear_div);

      let wear_header = jQuery('<h3 class="foldout">'+wear.name[lang]+' <span class="wear-price"></span> '+FVSignup.config.dkk[lang]+'</h3>');
      wear_div.append(wear_header);
      
      let wear_content = jQuery('<div class="wear-item-content"></div>');
      wear_content.hide();
      wear_div.append(wear_content);

      // Foldout functionality for the header and content
      wear_header.click(function() {
        wear_content.toggle();
        if (wear_content.is(":visible")) {
          wear_header.addClass('open');
        } else {
          wear_header.removeClass('open');
        }
      });
      
      if(wear.desc) wear_content.append('<p>'+wear.desc[lang]+'</p>');
      
      //------------------------------------------------------------------------------
      // Image section
      //------------------------------------------------------------------------------
      let image_wrapper = jQuery('<div class="wear-item-image-wrapper"></div>');
      wear_content.append(image_wrapper);

      //------------------------------------------------------------------------------
      // Attribute selection
      //------------------------------------------------------------------------------
      let sorting = [];
      let selections = {};
      for (const variant_id in wear.variants) {
        const variant = wear.variants[variant_id];
        for(const type in variant) {
          // Add selection type if not already added by other variants
          if(!selections[type]) {
            selections[type] = {}
            sorting[this.config.attribute_type[type].position] = type;
          }
          // Add each selection option of type for the variant
          for(const [id, attribute] of Object.entries(variant[type])) {
            if (selections[type][attribute.position]) {
              selections[type][attribute.position].variants.push(variant_id);
            } else {
              selections[type][attribute.position] = {
                text: attribute['desc_'+lang],
                value: attribute.id,
                variants: [variant_id],
              }
            }
          }
        }
      }

      // Add selection elements
      if (sorting.length != 0) {
        let selection_wrapper = jQuery('<div class="wear-selection-wrapper"></div>');
        let first = true;
        let first_select;
        let type_count = 0;
        for (const type of sorting){
          if(!type) continue;
          type_count++; // Only counting the ones that are actually set
          let input_wrapper = this.render_attribute_select(wear, type, selections[type]);
          selection_wrapper.append(input_wrapper);
          let select = input_wrapper.find('select')
          select.change(function(evt) {
            FVSignupModuleWear.select_update(evt.target);
          })
          if (first) {
            first = false;
            first_select = select;
          }
        }
        if(this.wear_info.max_attribute_type) {
          this.wear_info.max_attribute_type = Math.max(this.wear_info.max_attribute_type, type_count);
        } else {
          this.wear_info.max_attribute_type = type_count;
        }
        wear_content.append(selection_wrapper);
        first_select.change();
      }

      //------------------------------------------------------------------------------
      // Basket section
      //------------------------------------------------------------------------------
      let basket_section = jQuery('<div class="basket-section"></div>');
      wear_content.append(basket_section);

      // Amount selection
      let amount_wrapper = jQuery('<div class="input-wrapper wear-amount"></div>');
      amount_wrapper.append(`<label for="wear-amount-${wear.id}">${this.config.amount[lang]}:</label>`);
      amount_wrapper.append('<button class="wear-amount-button decrease">-</button>');
      amount_wrapper.append(`<input class="wear-amount" id="wear-amount-${wear.id}" type="number" min="1" max="10" step="1" value="1" size="2">`);
      amount_wrapper.append('<button class="wear-amount-button increase">+</button>');
      basket_section.append(amount_wrapper);

      let amount = amount_wrapper.find('input');
      amount_wrapper.find('button').click(function(evt) {
        let button = jQuery(evt.delegateTarget);
        let value = parseInt(amount.val());
        value = isNaN(value) ? 1 : value;
        if (button.hasClass('increase')) {
          value = Math.min(value + 1, 10);
        } else {
          value = Math.max(value - 1, 1);
        }
        amount.val(value);
      })

      // Add order button
      basket_section.append(`<button class="wear-add-button">${this.config.add[lang]}</button>`);
      basket_section.find('button.wear-add-button').click(function() {
        FVSignupModuleWear.add_wear_order(wear_div);
      })
    }
    let column_count = this.wear_info.max_attribute_type + 3;
    this.element.find('table#wear-orders th').attr('colspan', column_count);
  }

  static render_attribute_select(wear, type, attributes) {
    let lang = FVSignup.get_lang();
    let input_wrapper = jQuery('<div class="input-wrapper wear-attribute"></div>');
    input_wrapper.append(`<label for="wear-attribute-${wear.id}-${type}">${this.config.attribute_type[type][lang]}:</label>`);

    let select = jQuery(`<select id="wear-attribute-${wear.id}-${type}" wear-attribute="${type}" class="wear-attribue-select"><select>`);
    for (const [key, attribute] of Object.entries(attributes)) {
      let variants = attribute.variants.join();
      select.append(`<option variants="${variants}" value="${attribute.value}">${attribute.text}</option>`);
    }
    input_wrapper.append(select);

    return input_wrapper;
  }

  static select_update(select) {
    let option = jQuery(select.selectedOptions[0]);
    let variants = option.attr('variants').split(',');

    // Filter for common variants among previous options
    let wrapper = jQuery(select).closest('.input-wrapper.wear-attribute');
    for (let prev = wrapper.prev(); prev.length > 0; prev = prev.prev()) {
      let pre_option = jQuery(prev.find('select')[0].selectedOptions[0]);
      variants = variants.filter(function(value) {
        return pre_option.attr('variants').split(',').includes(value);
      })
    }

    // Filter out options not available for current variants
    for (let next = wrapper.next(); next.length > 0; next = next.next()) {
      let next_select = next.find('select')[0];
      let first_valid;
      let invalid_selection = false;
      for(const option of next_select.options) {
        let common_variants = variants.filter(function(value) {
          return jQuery(option).attr('variants').split(',').includes(value);
        })
        if (common_variants.length > 0) {
          first_valid = first_valid ?? option;
          option.disabled = false;
          option.hidden = false;
        } else {
          if (next_select.selectedOptions[0] == option) {
            invalid_selection = true;
          }
          option.disabled = true;
          option.hidden = true;
        }
      }
      if (invalid_selection) next_select.value = first_valid.value;
    }
    
    this.update_picture(wrapper.closest('.wear-item'));
  }

  static update_picture(wear_element) {
    let wear_id = wear_element.attr('wear-id');
    let wear_item = this.wear_items[wear_id]
    console.log(wear_item);
  }

  static add_wear_order(wear_element) {
    let order_list = this.element.find('table#wear-orders tbody');

    let wear_id = wear_element.attr('wear-id');
    let new_row = jQuery(`<tr class="wear-order" wear-id="${wear_id}"></tr>`);

    let name = wear_element.find('h3').text();
    new_row.append(`<td class="wear-name">${name}</td>`);

    // Add attribute cells
    let attribute_count = 0;
    wear_element.find('select').each(function() {
      let select = jQuery(this);
      let type = select.attr('wear-attribute');
      let value = this.selectedOptions[0].value;
      let text = this.selectedOptions[0].text;
      new_row.append(`<td class="wear-attribute" type="${type}" attribute-id="${value}">${text}</td>`);
      attribute_count++;
    })

    // Check for duplicates
    let same_id = order_list.find(`tr[wear-id=${wear_id}]`);
    let same_attributes;
    if (same_id.length > 0) {
      same_id.each(function() {
        let diff = false;
        jQuery(this).find('td.wear-attribute').each(function() {
          let cell = jQuery(this);
          let type = cell.attr('type');
          let new_cell = new_row.find(`td[type=${type}]`);
          if (cell.attr('attribute-id') != new_cell.attr('attribute-id')) {
            diff = true;
          }
        })
        if (!diff) same_attributes = jQuery(this);
      })
    }

    let amount = wear_element.find('input.wear-amount').val();

    if (same_attributes) {
      // We have an existing order with same attributes
      // Just update the amount (if amount is the same it stays the same)
      same_attributes.find('td.wear-amount input.wear-amount').val(amount);
      return;
    }

    // Stretch a cell to make row fit
    let missing_cells = this.wear_info.max_attribute_type - attribute_count;
    if (missing_cells > 0) {
      let stretch_cell;
      if (attribute_count == 0) {
        stretch_cell = new_row.find('td.wear-name');
      } else {
        stretch_cell = new_row.find('.wear-attribute').first()
      }
      stretch_cell.attr('colspan', missing_cells+1);
    }

    // We have a new unique order
    let amount_cell = jQuery(`<td class="wear-amount"></td>`)
    new_row.append(amount_cell);

    let amount_wrapper = jQuery('<div class="input-wrapper wear-order-amount"></div>');
    amount_cell.append(amount_wrapper);

    amount_wrapper.append('<button class="wear-amount-button decrease">-</button>');
    amount_wrapper.append(`<input class="wear-amount" type="number" min="1" max="10" step="1" value="${amount}" size="2">`);
    amount_wrapper.append('<button class="wear-amount-button increase">+</button>');

    let amount_input = amount_cell.find('input');
    amount_cell.find('button').click(function(evt) {
      let button = jQuery(evt.delegateTarget);
      let value = parseInt(amount_input.val());
      value = isNaN(value) ? 1 : value;
      if (button.hasClass('increase')) {
        value = Math.min(value + 1, 10);
      } else {
        value = Math.max(value - 1, 1);
      }
      amount_input.val(value);
    })

    let lang = FVSignup.get_lang();
    new_row.append(`<td class="wear-delete-order"><button class="delete-order-button">${this.config.delete[lang]}</button></td>`);
    new_row.find('button.delete-order-button').click(function() {
      new_row.remove();
      if (order_list.find('tr.wear-order').length == 0) {
        order_list.find('.no-orders').show();    
      }
    })
    order_list.append(new_row);
    order_list.find('.no-orders').hide();
  }

  static load_input (input) {
  }
}

FVSignup.register_module('wear', FVSignupModuleWear);