<?php
/**
Plugin Name: Fastaval Tilmeldingsmodul
Plugin URI: TBA
Description: Modul til styring af tilmelding for Rolle- og Bræspilskongressen Fastaval
Version: 0.0.1
Author: Mikkel Westh, Mads Thy
Author URI: https://westh.it
 */

include "fv-signup-options.php";

add_action( 'init', 'FVSignup::init' );
class FVSignup {
  static $current_path;
  static $base_path;
  static $page;

  static function init() {
    FVSignupOptions::init();
    add_action('pre_get_posts', 'FVSignup::pre_get_posts');
  }

  static function pre_get_posts(&$query) {
    global $wp;

    // Only run on main query
    if (!$query->is_main_query()) return;
    //error_log("Query:".print_r($query, true), 3, plugin_dir_path(__FILE__)."/debug.log");

    // Check if we're trying to access an enabled signup page
    if (isset($query->query['pagename'])) {
      self::$base_path = $query->query['pagename'];
    } elseif (!isset($query->query['name'])) {
      if (!isset($query->query['attachment'])) {
        return;
      }
      self::$base_path = explode('/', $wp->request)[0];
    } else {
      self::$base_path = $query->query['name'];
    }

    if(!FVSignupOptions::is_enabled_page(self::$base_path)) return;
    if(isset($query->query['attachment'])) {
      self::$page = $query->query['attachment'];
      $query->is_attachment = "";
    }

    // Save page adress for later
    self::$current_path = $wp->request;
    // Go to the signup page
    $query->query_vars['name'] = FVSignupOptions::default_page();
    
    // Variables needed for correct template
    $query->is_page = 1;
    $query->is_single = '';

    // Change page content so people know the signup is available
    // NOTE: all this is cleared when the Javascript is loaded
    add_filter('the_content', function($content) {
      $content = 
        "<div class='signup-placeholder'>".
        "  <h2>Loading signup plugin</h2>".
        "  <p>If this message doesn´t go away, there might have been a script error.<br>".
        "  You may need to use a different browser and/or make sure javascript is enabled</p>".
        "</div>"
      ;
      return $content;
    });

    add_action('wp_enqueue_scripts', function() {
      $settings = get_option('fv_signup_options');
      $settings['lang'] = substr(get_locale(), 0, 2);
      $settings['plugin_root'] = plugin_dir_url(__FILE__);
      $settings['base'] = "/".FVSignup::$base_path."/";
      $settings['start_page'] = FVSignup::$page;

      // General Scripts
      wp_enqueue_script('fv-signup-script-main', plugin_dir_url(__FILE__)."scripts/main.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/main.js"));
      wp_localize_script('fv-signup-script-main', "fv_signup_settings", $settings);
      wp_enqueue_script('fv-signup-script-render', plugin_dir_url(__FILE__)."scripts/render.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/render.js"));
      wp_enqueue_script('fv-signup-script-logic', plugin_dir_url(__FILE__)."scripts/logic.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/logic.js"));
      wp_enqueue_script('fv-signup-script-storage', plugin_dir_url(__FILE__)."scripts/storage.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/storage.js"));
      
      // Module scripts
      wp_enqueue_script('fv-signup-script-module-food', plugin_dir_url(__FILE__)."scripts/module_food.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/module_food.js"));
      wp_enqueue_script('fv-signup-script-module-activities', plugin_dir_url(__FILE__)."scripts/module_activities.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/module_activities.js"));
      wp_enqueue_script('fv-signup-script-logic-activities', plugin_dir_url(__FILE__)."scripts/logic_activities.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/logic_activities.js"));
      wp_enqueue_script('fv-signup-script-module-wear', plugin_dir_url(__FILE__)."scripts/module_wear.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/module_wear.js"));
      wp_enqueue_script('fv-signup-script-module-submit', plugin_dir_url(__FILE__)."scripts/module_submit.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/module_submit.js"));
      wp_enqueue_script('fv-signup-script-module-hero', plugin_dir_url(__FILE__)."scripts/module_hero.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/module_hero.js"));

      // Render scripts from Infosys
      wp_enqueue_script('fv-signup-script-infosys-render', $settings['infosys_url']."/js/signup/render.js?", array( 'jquery' ), 10);
      wp_enqueue_script('fv-signup-script-infosys-process', $settings['infosys_url']."/js/signup/preprocess.js", array( 'jquery' ), 6);

      // Styles
      wp_enqueue_style( 'fv-signup-styles-main', plugin_dir_url(__FILE__)."styles/main.css",'', filemtime(plugin_dir_path(__FILE__)."styles/main.css"));
    });
  }
}