"using strict";

class FVSignupModuleWear {
  static element;
  static wear_info;
  static size_order = [];

  static init(element) {
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
    });
  }

  static render_wear() {
    this.element.empty();
    this.element.append('<p><strong>!!WORK IN PROGRESS!!</strong></p>');
    for(const wear of this.wear_info.wear) {
      let wear_div = jQuery('<div class="wear-item"><div>');
      wear_div.attr('id', 'wear-'+wear.id);
      let lang = FVSignup.get_lang();
      wear_div.append('<p>'+wear.name[lang]+'</p>');
      if (wear.min_size != wear.max_size) {
        wear_div.append(this.render_size_select(wear));
      } else if (wear.max_size != 1) {
        wear_div.append('<p>'+this.wear_info.sizes[wear.max_size].name[lang]+'</p>');
      }
      wear_div.append(this.render_amount_select(wear, 10));
      this.element.append(wear_div);
    }
  }

  static render_size_select(wear) {
    let select = jQuery('<select class="wear-size-select"><select>');
    select.attr('id', 'wear-size-'+wear.id);
    for(let i = this.wear_info.sizes[wear.min_size].order; i <= this.wear_info.sizes[wear.max_size].order; i++) {
      let size = this.wear_info.sizes[this.size_order[i]];
      select.append('<option value="'+size.id+'">'+size.name[FVSignup.get_lang()]+'</option>');
    }
    return select;
  }

  static render_amount_select(wear, max) {
    let select = jQuery('<select class="wear-amount-select"><select>');
    select.attr('id', 'wear-amount-'+wear.id);
    for(let i = 0; i <= max; i++) {
      select.append('<option value="'+i+'">'+i+'</option>');
    }
    return select;
  }
}