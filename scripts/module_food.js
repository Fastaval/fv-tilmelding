"using strict";

class FVSignupModuleFood {
  static div;
  static info;
  static config;

  static init(element, callback) {
    this.div = jQuery('<div id="food_module" class="module-div" module="food"></div>');
    this.div.append('<p>Loading food module</p>');
    element.append(this.div);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/food",
      success: function (info) {
        FVSignupModuleFood.info = info;
        if (FVSignupModuleFood.config) FVSignupModuleFood.render_food();
      }
    }).fail(function () {
      FVSignup.com_error();
    }).always(function (){
      callback();
    });

    FVSignup.load_config('food', function (config) {
      FVSignupModuleFood.config = config;
      if (FVSignupModuleFood.info) FVSignupModuleFood.render_food();
    });
  }

  static render_food() {
    let food_info = this.info;
    let lang = fv_signup_settings.lang;
    this.div.empty();

    let table = jQuery('<table id="food-select-table"></table>');
    let tbody = jQuery('<tbody></tbody>');
    table.append(tbody);
    this.div.append(table);

    for (const [day, foods] of Object.entries(food_info.days)) {
      let day_text = FVSignup.get_weekday(day);
      day_text = FVSignup.uc_first(day_text);
      tbody.append(`<tr><td colspan="10"><h3>${day_text}</h3></td></tr>`);
      let selection_row = jQuery('<tr></tr>');
      tbody.append(selection_row);

      for (const [cat_id, food_cat] of Object.entries(food_info.categories)) {
        let cat_split = food_cat[lang].split(':');
        
        let cat_text = cat_split[0];

        let cell = selection_row.find(`td[cat="${cat_text}"]`)
        let new_cell = false;
        if (cell.length == 0) {
          cell = jQuery(`<td cat="${cat_text}"></td>`);
          selection_row.append(cell);
          new_cell = true;
          if (cat_split.length > 1) {
            cell.css('white-space', 'nowrap');
          }
        }
        
        let food = foods[cat_id];
        if (food === undefined) continue;

        if (new_cell) {
          cell.append(`<div><strong>${cat_text} (${food_cat.price} ${FVSignup.config.dkk[lang]})</strong></div>`);
        }

        let checkbox_wrapper = InfosysSignupRender.render_checkbox({
          infosys_id: "food:"+food.id, 
          processed: food.text[lang]
        });
        
        let checkbox = checkbox_wrapper.find('input');
        checkbox.attr('submit-text', `${day_text}: ${cat_text}`)
        checkbox.attr('submit-value', `${food.text[lang]} ({price} ${FVSignup.config.dkk[lang]})`)
        checkbox.attr('food-category', cat_id);

        if (food_cat.exclude) checkbox.change(function() {
          if (!checkbox.prop('checked')) return; // Only do something if we enabled the checkbox

          let row = checkbox.closest('tr');
          let other = row.find(`input[food-category=${food_cat.exclude}]`);
          other.prop('checked', false);
        });

        cell.append(checkbox_wrapper);
      }
    }
  }

  static get_error_msg(error) {
    let label, msg;
    let lang = FVSignup.get_lang();

    if (this.config.errors[error.type]) {
      msg = this.config.errors[error.type][lang];
    }

    return [label, msg];
  }

  static get_confirm(entry) {
    let text, value;

    if (entry.warning) {
      // Warning text
      let lang = FVSignup.get_lang();
      let warn = this.config.warning[lang];
      let warn_text = this.config.warnings[entry.warning][lang];
      text = `<strong>${warn}! ${warn_text}</strong>`;

      // Warning value
      if (entry.warning == 'unused_food_credits') {
        let breakfast = this.config.breakfast[lang];
        let dinner = this.config.dinner[lang];
        let remaining = this.config.remaining[lang];
        
        let breakfast_remaining = `${breakfast} ${remaining}: ${entry.breakfast_remaining}`;
        let dinner_remaining = `${dinner} ${remaining}: ${entry.dinner_remaining}`;

        value = "";
        if (entry.breakfast_remaining > 0) value = breakfast_remaining;
        if (entry.dinner_remaining > 0) {
          if (value !== "") value += '<br>';
          value += dinner_remaining;
        }
      } else {
        value = entry.value;
      }
    } else {
      let id = entry.key.replaceAll(':', '\\:');
      text = jQuery('label[for='+id+']').text().replace(':','');
    }

    return [text, value];
  }
}

FVSignup.register_module('food', FVSignupModuleFood);