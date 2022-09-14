"using strict";

class FVSignupModuleActivities {
  static element;

  static init(element) {
    this.element = element;
    element.append('<div id="activities_module"><p>Loading activities module</p></div>');

    jQuery.getJSON({
      url: fv_signup_settings.infosys_url+"/api/signup/activities",
      success: function (activities) {
        console.log(activities);
        FVSignupModuleActivities.render_activities(activities);
      }
    })
  }

  static render_activities(activities) {
    

  }
}