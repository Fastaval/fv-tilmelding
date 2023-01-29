"using strict";

class FVSignupModuleFood {
  static div;

  static init(element, callback) {
    this.div = jQuery('<div id="food_module" class="module-div" module="food"></div>');
    this.div.append('<p>Loading food module</p>');
    element.append(this.div);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/food",
      success: function (food) {
        FVSignupModuleFood.render_food(food);
      }
    }).fail(function () {
      FVSignup.com_error();
    }).always(function (){
      callback();
    });
  }

  static render_food(food_info) {
    let lang = fv_signup_settings.lang;
    this.div.empty();

    let table = jQuery('<table id="food-select-table"></table>');
    let tbody = jQuery('<tbody></tbody>');
    table.append(tbody);
    this.div.append(table);

    for (const [day, foods] of Object.entries(food_info.days)) {
      let day_text = FVSignup.get_weekday(day);
      day_text = FVSignup.uc_first(day_text);
      tbody.append(`<tr><td colspan="3"><h3>${day_text}</h3></td></tr>`);
      let selection_row = jQuery('<tr></tr>');
      tbody.append(selection_row);

      for (const [cat_id, food_cat] of Object.entries(food_info.categories)) {
        let cat_text = food_cat[lang];

        let cell = jQuery('<td></td>');
        selection_row.append(cell);
        
        let food = foods[cat_id];
        if (food === undefined) continue;

        cell.append(`<div><strong>${cat_text} (${food_cat.price} ${FVSignup.config.dkk[lang]})</strong></div>`);

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
}

FVSignup.register_module('food', FVSignupModuleFood);