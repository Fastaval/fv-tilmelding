"using strict";

class FVSignupLogicActivities {
  static activity_info;

  static init_choices(activity_info) {
    this.activity_info = activity_info;
    let choices = jQuery('#activities_module .activity-choice');
    
    choices.click(function(evt) {
      FVSignupLogicActivities.choice_click(jQuery(evt.delegateTarget));
      evt.stopPropagation();
    });

    choices.find('input').change(function(evt){
      FVSignupLogicActivities.choice_change(jQuery(evt.target));
    })
  }

  static choice_click(choice) {
    let input = choice.find('input');
    let value = parseInt(input.val());
    isNaN(value) && (value = 0);

    let lang = fv_signup_settings.lang;
    let gm = choice.attr('activity-gm');
    let prio_count = this.activity_info.choices.prio[lang].length;
    let max = gm == 'true' ? prio_count + 2 : prio_count;

    value++
    while (value == 1 || value == 2 || value == prio_count + 1) {
      // Check if we have other runs overlapping

      // Find all the runs with same priority within the same day
      let day_table = choice.closest('table')
      let same_prio;
      if (value == 2) { 
        same_prio = day_table.find('input[value="2"]');
      } else { // "GM - 1st" count as 1st 
        same_prio = day_table.find('input[value="1"],input[value="'+(prio_count + 1)+'"]');
      }
      
      // Don't count the one we clicked
      same_prio = same_prio.not('input#'+input.attr('id'));

      // If we have no other runs with same priority, we're done
      if(same_prio.length == 0) break;

      let run_start = parseInt(choice.attr('run-start'));
      let run_end = parseInt(choice.attr('run-end'));
      // Does any of the same prio overlap?
      let overlap = false;
      for (const other of same_prio) {
        let other_choice = jQuery(other).closest('.activity-choice');

        let other_start = parseInt(other_choice.attr('run-start'));
        let other_end = parseInt(other_choice.attr('run-end'));

        // If other run is before this one
        if (other_start < run_start && other_end <= run_start) continue;

        // If other run is after this one
        if (other_start >= run_end && other_end > run_end) continue;

        overlap = true;
        break;
      }

      if (overlap == false) break; // There was no overlap and we keep the current value
      
      value++; // There was overlap and we go with next priority
    }

    input.val((value) % (max + 1));
    input.change();
  }

  static choice_change(input) {
    let lang = fv_signup_settings.lang;
    let label = input.next();
    let value = input.val();
    let choices = this.activity_info.choices;
    let type = input.closest('.activity-choice').attr('activity-type');
    let gm_text = choices.gm[type] ? choices.gm[type][lang] : choices.gm.default[lang];
    let prio_count = this.activity_info.choices.prio[lang].length;
    
    switch (true) {
      case value == 0:
        label.text('');
        break;

      case value <= prio_count:
        label.text(choices.prio[lang][value-1]);
        break;
    
      case value == prio_count + 1:
        label.text(gm_text);
        break;

      case value == prio_count + 2:
        label.text(gm_text+' - '+choices.prio[lang][0]);
        break;

      default:
        break;
    }
  }
}