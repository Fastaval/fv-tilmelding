"using strict";

class FVSignupModuleActivities {
  static element;

  static init(element) {
    this.element = jQuery('<div id="activities_module"></div>');
    this.element.append('<p>Loading activities module</p>');
    element.append(this.element);

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/activities",
      success: function (activities_info) {
        // console.log("Activity Module: get activities\n", activities_info);
        FVSignupModuleActivities.render_activities(activities_info);
      }
    })
  }

  static render_activities(activities_info) {
    this.element.empty();
    let lang = fv_signup_settings.lang;
    let filter = this.render_filter(activities_info.categories);
    let time_header = this.render_time_header(activities_info.table_headline[lang]);
    for(const day in activities_info.runs){
      // Filter
      this.element.append(filter.prop('outerHTML'));
      
      // Day header
      let day_text = FVSignup.get_weekday(day);
      day_text = day_text.substr(0,1).toUpperCase() + day_text.substr(1);
      this.element.append('<div class="dayheader">'+day_text+'</div>');

      // Activities table
      let table = jQuery('<table id="activities-day-'+day+'"></table>');
      let table_body = jQuery('<tbody></tbody>');
      table.append(table_body);

      // Time header
      table_body.append(time_header.prop('outerHTML'));

      for (const run of activities_info.runs[day]) {
        // normalize times within time table
        if(run.start.hour < activities_info.day_cutoff) run.start.hour += 24;
        if(run.end.hour < activities_info.day_cutoff) run.end.hour += 24;

        // Activity row
        let activity = activities_info.activities[run.activity];
        let category = activities_info.categories[activity.type] ? activity.type : 'default';
        let row = jQuery('<tr class="activity-row"></tr>');
        row.addClass(activity.type);
        row.addClass(category);
        row.attr('activity-id', run.activity);
        
        // Flag & Title cell
        let flag = this.get_flag(activity.lang);
        let title = activity.title[lang] ? activity.title[lang] : activity.title.da;
        row.append('<td class="activity-title">'+flag+'<div class="title-wrapper">'+title+'</div></td>');
        
        // calculate cell positions
        let start = (run.start.hour -7.5)*2;
        start += Math.round(run.start.min/30);
        let end = (run.end.hour -7.5)*2;
        end += Math.round(run.end.min/30);
        
        // Spacing cell
        row.append('<td colspan="'+start+'"></td>');
        
        // Selection cell
        let select_cell = jQuery('<td class="activity-cell" colspan="'+(end-start)+'"></td>');
        row.append(select_cell);

        // Select input
        let choice = this.render_choice(activity, run, category);
        let color = activities_info.categories[category].color;
        choice.css('background-color', color);
        select_cell.append(choice);

        table_body.append(row);

        // Description row
        let desc_row = jQuery('<tr class="description-row"></tr>');
        let desc_cell = jQuery('<td colspan="60" class="description-cell"></td>');
        desc_cell.append('<p>'+activity.desc[lang]+'</p>');
        if (activity.wp_id != 0) {
          desc_cell.append('<a href="/index.php?p='+activity.wp_id+'&lang='+lang+'">'+activities_info.link_text[lang]+'</a>');
        }
        desc_row.hide();
        desc_row.append(desc_cell);

        table_body.append(desc_row);
      }


      this.element.append(table);
    }
    FVSignupLogicActivities.init(activities_info);
  }

  static render_filter(categories) {
    let filter = jQuery('<div class="filter"></div>');
    let lang = fv_signup_settings.lang;

    for(const [id, cat] of Object.entries(categories)) {
      if (cat.nobutton) continue;

      let category = id;
      if (cat.include) category += " " + cat.include.join(" ");

      let filter_button = jQuery('<div class="filter-button '+category+'"></div>');
      filter_button.attr('filter-category', category)
      filter_button.text(cat[lang]);
      if(id == 'all') filter_button.addClass('selected');
      filter.append(filter_button);
    }

    return filter;
  }

  static render_time_header(headline) {
    let row = jQuery('<tr class="header-row"></tr>');
    let activities = jQuery('<td class="table-header" colspan="2">'+headline+'</td>');
    row.append(activities);
    row.append('<td></td>');

    for(let i = 8; i < 27; i++) {
      let time = (i % 24)
      row.append('<td colspan="2" class="time-section"><div class="time"><span class="time-label">'+time+'</span></div></td>');
    }

    return row;
  }

  static render_choice(activity, run) {
    let choice = jQuery('<div class="activity-choice '+activity.type+'"></div>');
    choice.attr('activity-type', activity.type);
    choice.attr('activity-gm', activity.gm);
    choice.attr('run-start', run.start.stamp);
    choice.attr('run-end', run.end.stamp);
    choice.append('<input type="hidden" id="'+run.id+'" value="0">');
    choice.append('<div class="choice-text"></div>');
    return choice;
  }

  static get_flag(lang) {
    let file_name;
    switch (true) {
      case lang.en && lang.da:
        file_name = "flag-dansk+engelsk.jpg";
        break;

      case lang.en:
        file_name = "flag-engelsk.jpg";
        break;

      case lang.da:
        file_name = "flag-dansk.jpg";
        break;
    
      default:
        return "";
    }

    let root = fv_signup_settings.plugin_root;
    return '<div class="flag-wrapper" style="width:24px; height:16px"><img src="'+root+'/flags/'+file_name+'"></div>';
  }
}