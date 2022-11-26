"using strict";

class FVSignupModuleWear {
  static config;
  static element;
  static wear_info;
  static wear_items = {};

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

    FVSignupLogic.add_listener('page_wear', function(){
      FVSignupModuleWear.update_prices();
    })
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
          '<tr class="orders-total"><td class="total-text-cell">Total:</td><td class="total-cell"> 0 ' + FVSignup.config.dkk[lang] + '</td></tr>'+
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

      if (wear.max_order) {
        wear_header.append(` (Max ${wear.max_order})`);
        wear_div.attr('max-order', wear.max_order);
      }

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

      image_wrapper.append('<img>');
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
      } else {
        this.update_picture(wear_div);
      }

      // Set header width to match number of attributes
      let attribute_count = this.wear_info.max_attribute_type;
      this.element.find('table#wear-orders th').attr('colspan', attribute_count + 4);
      this.element.find('table#wear-orders tr.no-orders td').attr('colspan', attribute_count + 4);
      this.element.find('table#wear-orders td.total-text-cell').attr('colspan', attribute_count + 2);

      //------------------------------------------------------------------------------
      // Basket section
      //------------------------------------------------------------------------------
      let basket_section = jQuery('<div class="basket-section"></div>');
      wear_content.append(basket_section);

      // Amount selection
      if (wear.max_order == 1) {
        basket_section.append(`<input class="wear-amount" id="wear-amount-${wear.id}" type="hidden" value="1">`);
      } else {
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
      }

      // Add order button
      basket_section.append(`<button class="wear-add-button">${this.config.add[lang]}</button>`);
      basket_section.find('button.wear-add-button').click(function() {
        FVSignupModuleWear.add_wear_order(wear_div);
      })
    }
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

  static update_prices() {
    let participant_type = FVSignup.get_participant_type();

    this.element.find('.wear-item').each(function() {
      let wear_element = jQuery(this);
      let id = wear_element.attr('wear-id');
      let wear_item = FVSignupModuleWear.wear_items[id];
      let price_type, price_value;
      
      // Find the cheapest valid price
      for(const price of wear_item.prices) {
        let price_valid;
        switch(price.user_category) {
          case 0:
            price_valid = participant_type == 'organizer';
            break;

          case 1:
            price_valid = participant_type == 'deltager' || participant_type == 'junior-plus';
            break;

          case 10:
            price_valid = participant_type == 'junior';
            break;

          default:
            let category = parseInt(FVSignup.get_input('organizercategory').val());
            price_valid = price.user_category == category;
        }
        if (price_valid && (!price_value || price.price < price_value)) {
          price_type = price.user_category;
          price_value = price.price;
        }
      }

      // Update price for item
      if (price_value !== undefined) {
        wear_element.find('h3 span.wear-price').text(price_value);
        wear_element.attr('price-category', price_type);
        wear_element.show();
      } else {
        wear_element.hide();
      }
    })
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
    let wear_item = this.wear_items[wear_id];

    let selections = {};
    wear_element.find('select').each(function() {
      selections[jQuery(this).attr('wear-attribute')] = parseInt(jQuery(this).val());
    })

    for(const [id, image] of Object.entries(wear_item.images)) {
      let diff = false;
      for(const type in image.attributes) {
        if(type == 'special') continue;
        if (!image.attributes[type].includes(selections[type])) diff = true;
      }
      if (diff == false) {
        wear_element.find('.wear-item-image-wrapper img').attr('src', FVSignup.get_infosys_url() + encodeURI(image.image_file));
        return;
      }
    }
  }

  static add_wear_order(wear_element) {
    let lang = FVSignup.get_lang();
    let wear_id = wear_element.attr('wear-id');
    let max_order = this.wear_items[wear_id].max_order;
    let name = wear_element.find('h3').text();
    let order_list = this.element.find('table#wear-orders tbody');

    let new_row = jQuery(`<tr class="wear-order" wear-id="${wear_id}"></tr>`);
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
    let same_count = 0;
    if (same_id.length > 0) {
      if (max_order == 1) {
        alert(`${this.config.max_error[lang]} 1 ${name}`);
        return;
      }
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
        same_count += parseInt(jQuery(this).find('input.wear-amount').val());
      })
    }

    let amount = wear_element.find('input.wear-amount').val();
    if (same_count + parseInt(amount) > max_order) {
      alert(`${this.config.max_error[lang]} ${max_order} ${name}`);
      return;
    }

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
    // Amount cell
    let amount_cell = jQuery(`<td class="wear-amount"></td>`)
    new_row.append(amount_cell);

    let amount_input;
    if (max_order == 1) {
      amount_cell.text(amount);
    } else {
      let amount_wrapper = jQuery('<div class="input-wrapper wear-order-amount"></div>');
      amount_cell.append(amount_wrapper);
  
      amount_wrapper.append('<button class="wear-amount-button decrease">-</button>');
      amount_wrapper.append(`<input class="wear-amount" type="number" min="1" max="10" step="1" value="${amount}" size="2">`);
      amount_wrapper.append('<button class="wear-amount-button increase">+</button>');
  
      amount_input = amount_cell.find('input');
      amount_cell.find('button').click(function(evt) {
        let button = jQuery(evt.delegateTarget);
        let value = parseInt(amount_input.val());
        value = isNaN(value) ? 1 : value;
        if (button.hasClass('increase')) {
          value = Math.min(value + 1, 10);
        } else {
          value = Math.max(value - 1, 1);
        }
        // Check for max
        if (max_order) {
          // Check for duplicates
          let same_id = order_list.find(`tr[wear-id=${wear_id}]`).not(new_row);
          let same_count = 0;
          same_id.each(function() {
            same_count += parseInt(jQuery(this).find('input.wear-amount').val());
          })

          if (same_count + value > max_order) {
            alert(`${FVSignupModuleWear.config.max_error[lang]} ${max_order} ${name}`);
            return;
          }
        }
        amount_input.val(value);
        amount_input.change();
      })
    }

    // Price cell
    let price =  parseInt(wear_element.find('h3 span.wear-price').text());
    let subtotal = parseInt(amount) * price;
    let price_category = wear_element.attr('price-category');
    let price_cell = jQuery(`<td class="price-cell" price-category="${price_category}">${subtotal} ${FVSignup.config.dkk[lang]}</td>`);
    new_row.append(price_cell)

    if (amount_input) {
      amount_input.change(function() {
        let amount = parseInt(amount_input.val());
        let subtotal = amount * price;
        price_cell.text(`${subtotal} ${FVSignup.config.dkk[lang]}`);
        FVSignupModuleWear.update_total();
      })
    }

    // Delete button
    new_row.append(`<td class="wear-delete-order"><button class="delete-order-button">${this.config.delete[lang]}</button></td>`);
    new_row.find('button.delete-order-button').click(function() {
      new_row.remove();
      FVSignupModuleWear.update_total();
      if (order_list.find('tr.wear-order').length == 0) {
        order_list.find('.no-orders').show();    
      }
    })
    order_list.find('tr.orders-total').before(new_row)
    order_list.find('.no-orders').hide();
    this.update_total();
  }

  static update_total() {
    let total = 0;
    this.element.find('table#wear-orders .wear-order').each(function() {
      total += parseInt(jQuery(this).find('td.price-cell').text());
    })
    let lang = FVSignup.get_lang();
    this.element.find('table#wear-orders .total-cell').text(`${total} ${FVSignup.config.dkk[lang]}`);
  }

  static load_input (input) {
  }
}

FVSignup.register_module('wear', FVSignupModuleWear);