"using strict";

class FVSignupLogicActivities {
  static activity_info;

  // TODO Multiblok
  static init(activity_info) {
    this.activity_info = activity_info;

    this.init_choices();
    this.init_descriptions();
    this.init_categories();
    this.init_day_select();

    FVSignupLogic.add_listener('page_'+FVSignupModuleActivities.page_id, function(){
      FVSignupLogicActivities.on_page();
    });
  }

  static init_choices() {
    let choices = jQuery('#activities_module .activity-choice');
    
    choices.click(function(evt) {
      FVSignupLogicActivities.choice_click(jQuery(evt.delegateTarget));
      evt.stopPropagation();
    });

    choices.find('input').change(function(evt){
      FVSignupLogicActivities.choice_change(jQuery(evt.target));
    })
  }

  static init_descriptions() {
    let titles = jQuery('#activities_module td.activity-title');
    
    titles.click(function(evt) {
      let description = jQuery(evt.target).closest('.activity-row');
      while (!description.hasClass('description-row')) {
        description = description.next()
        if (description.length == 0) return;
      }
      if (description.css('display') == 'none') {
        jQuery('#activities_module .description-row').hide();
        description.show();
      } else {
        description.hide();
      }
      evt.stopPropagation();
    });
  }

  static init_categories() {
    // Activate click on all filter buttons
    let buttons = jQuery('#activities_module .filter .filter-button');
    buttons.click(function(evt) {
      let button = jQuery(evt.delegateTarget);
      let categories = button.attr('filter-category').split(' ');

      // Change selected buttons
      buttons.removeClass('selected');
      buttons.filter('.'+categories[0]).addClass('selected');

      FVSignupLogicActivities.select_category(categories);
    })
  }

  static init_day_select() {
    jQuery('#activities_module .day-button').click(function(evt) {
      let weekday = evt.delegateTarget.attributes.weekday.value;
      FVSignupLogicActivities.select_day(weekday);
    });
  }

  static on_page() {
    FVSignupModuleActivities.day_error.hide();
    this.participant_filter();
    this.age_filter();
    this.day_filter();
    this.category_filter();
  }

  static participant_filter() {
    let participant = FVSignup.get_input('participant').val();

    // We can ignore age filter since it's applied afterwards
    let hide, show;
    if (participant == 'Juniordeltager') {
      if (FVSignup.get_input('junior:plus').prop('checked')) {
        jQuery('#activities_module .filter *').show();
        jQuery('#activities_module .filter').show();
        show = jQuery('.activity-row');
        hide = jQuery();
      } else {
        jQuery('#activities_module .filter').hide();
        hide = jQuery('.activity-row').not('.junior');
        show = jQuery('.activity-row').filter('.junior');
      }
    } else {
      jQuery('#activities_module .filter .junior').hide();
      jQuery('#activities_module .filter').show();
      hide = jQuery('.activity-row').filter('.junior');
      show = jQuery('.activity-row').not('.junior');
    }
    hide.hide();
    hide.attr('participant-filtered', true);
    show.show();
    show.attr('participant-filtered', false);
  }

  static age_filter() {
    let age = FVSignup.get_age();

    let runs = jQuery('#activities_module table .activity-row');
    for(const run of runs) {
      let jqrun = jQuery(run);
      let activity_id = jqrun.attr('activity-id');
      let activity = this.activity_info.activities[activity_id];
      let age_appropriate = 'true';
      if (activity.max_age && activity.max_age < age) age_appropriate = 'too old';
      if (activity.min_age && activity.min_age > age) age_appropriate = 'too young';
      jqrun.attr('age-appropriate', age_appropriate);
      if (age_appropriate != 'true') {
        jqrun.hide();
      }
    }
  }

  static day_filter() {
    let current = null;

    // Hide days not attending
    for(let i = 1; i <= 5; i++) {
      // Day 1 of con = day 3 of week
      let weekday = i+2;
      let day_button = jQuery('#activities_module #day-button-'+weekday);
      if(FVSignup.attending_day(i)) {
        day_button.show();
        // Set current to first visible day unless another vissible day is selected
        current = current ?? weekday;
        if(day_button.hasClass('selected')) current = weekday;
      } else {
        day_button.hide();
      }
    }

    // Select first day attending
    if (current) {
      this.select_day(current);
    } else {
      // There are no vissible days
      FVSignupModuleActivities.day_error.show();
    }
  }

  static select_day(weekday) {
    jQuery('#activities_module .day-button.selected').removeClass('selected');
    jQuery('#activities_module #day-button-'+weekday).addClass('selected');
    jQuery('#activities_module #activity-tables-wrapper table').hide();
    jQuery('#activities_module #activities-day-'+weekday).show();
  }

  static category_filter() {
    let button = jQuery('#activities_module .filter .filter-button.selected');
    let categories = button.attr('filter-category').split(' ');
    this.select_category(categories)
  }

  static select_category(categories) {
    // Hide all activity and description rows
    let rows = jQuery('#activities_module tr').not('.header-row');
    rows.hide();

    // Filter out the rows we need to show and make them visible
    rows = rows.filter('.activity-row')
    if (categories[0] != 'all') {
      rows = rows.filter('.'+categories.join(', .'));
    }
    rows = rows.filter('[age-appropriate="true"]');
    rows = rows.filter('[participant-filtered="false"]');
    rows.show();
  }

  static choice_click(choice) {
    let input = choice.find('input');
    let value = parseInt(input.val());
    isNaN(value) && (value = 0);

    let lang = fv_signup_settings.lang;
    let gm = choice.attr('activity-gm') == 'true';
    let prio_count = this.activity_info.choices.prio[lang].length;
    let max = gm ? prio_count + 2 : prio_count;

    value++
    while (value == 1 || value == 2 || (value == prio_count + 2 && gm)) {
      // Check if we have other runs overlapping

      // Find all the runs with same priority within the same day
      let day_table = choice.closest('table')
      let same_prio;
      if (value == 2) { 
        same_prio = day_table.find('input[value="2"]');
      } else { // "GM - 1st" count as 1st 
        same_prio = day_table.find('input[value="1"],input[value="'+(prio_count + 2)+'"]');
      }
      
      // Don't count the one we clicked
      same_prio = same_prio.not('input#'+input.attr('id').replaceAll(':', '\\:'));

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

      if (!overlap) break; // There was no overlap and we keep the current value
      
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