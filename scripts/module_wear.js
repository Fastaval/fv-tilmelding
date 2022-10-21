"using strict";

class FVSignupModuleWear {
  static element;
  static wear_info;
  static size_order = [];

  static init(element, callback) {
    this.element = jQuery('<div id="wear_module"></div>');
    this.element.append('<p>Loading wear module</p>');
    element.append(this.element);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/wear",
      success: function (wear_info) {
        // console.log("Wear Module: get wear\n", wear_info);
        FVSignupModuleWear.wear_info = wear_info;
        for(const id in wear_info.sizes) {
          FVSignupModuleWear.size_order[wear_info.sizes[id].order] = id;
        }
        FVSignupModuleWear.render_wear();
      }
    }).fail(function () {
      FVSignup.com_error();
    }).always(function (){
      callback();
    });
  }

  static render_wear() {
    this.element.empty();
    this.element.append('<p><strong>!!WORK IN PROGRESS!!</strong></p>');
    for(const wear of this.wear_info.wear) {
      let lang = FVSignup.get_lang();

      //Create wear item wrapper
      let wear_div = jQuery('<div class="wear-item input-wrapper"></div>');
      wear_div.attr('id', 'wear-item-'+wear.id);
      wear_div.append('<p>'+wear.name[lang]+'</p>');
      this.element.append(wear_div);

      // Create hidden input
      let hidden = jQuery('<input type="hidden" id="wear:'+wear.id+'">');
      wear_div.append(hidden);

      // Create size input
      if (wear.min_size != wear.max_size) {
        wear_div.append(this.render_size_select(wear, hidden));
      } else if (wear.min_size != 1) {
        wear_div.append('<p>'+this.wear_info.sizes[wear.min_size].name[lang]+'</p>');
      }
      hidden.attr('size', wear.min_size);

      // Create amout input
      wear_div.append(this.render_amount_select(wear, 10, hidden));
      hidden.attr('amount', 0);
    }
  }

  static render_size_select(wear, hidden) {
    let select = jQuery('<select class="wear-size-select"><select>');
    select.attr('id', 'wear-size-'+wear.id);
    for(let i = this.wear_info.sizes[wear.min_size].order; i <= this.wear_info.sizes[wear.max_size].order; i++) {
      let size_id = this.size_order[i];
      let size = this.wear_info.sizes[size_id];
      select.append('<option value="'+size_id+'">'+size.name[FVSignup.get_lang()]+'</option>');
    }
    select.change(function(evt) {
      FVSignupModuleWear.update_item(evt, hidden);
    })
    return select;
  }

  static render_amount_select(wear, max, hidden) {
    let select = jQuery('<select class="wear-amount-select"><select>');
    select.attr('id', 'wear-amount-'+wear.id);
    for(let i = 0; i <= max; i++) {
      select.append('<option value="'+i+'">'+i+'</option>');
    }
    select.change(function(evt) {
      FVSignupModuleWear.update_item(evt, hidden);
    })
   return select;
  }

  static update_item(evt, hidden) {
    let select_id = evt.target.id;
    if (select_id.match('size')) {
      hidden.attr('size', evt.target.value);
    }
    if (select_id.match('amount')) {
      hidden.attr('amount', evt.target.value);
    }
    let size = hidden.attr('size');
    let amount = parseInt(hidden.attr('amount'));
    if (amount == 0 || isNaN(amount)) {
      hidden.val('');
    } else {
      hidden.val(`size:${size}--amount:${amount}`);
    }
    hidden.change();
  }

  static load_input (input) {
    let size = input.val().match(/size:(\d+)/)[1];
    let amount = input.val().match(/amount:(\d+)/)[1];
    input.attr('size', size);
    input.attr('amount', amount);
    let wrapper = input.closest('.wear-item');
    let size_select = wrapper.find('.wear-size-select');
    size_select.val(size);
    let amount_select = wrapper.find('.wear-amount-select');
    amount_select.val(amount);
  }
}