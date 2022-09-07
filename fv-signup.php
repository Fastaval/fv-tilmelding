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
  static $current_slug;

  static function init() {
    FVSignupOptions::init();
    add_action('pre_get_posts', 'FVSignup::pre_get_posts');
  }

  static function pre_get_posts(&$query) {
    // Only run on main query
    if (!$query->is_main_query()) return;
    //error_log("Query:".print_r($query, true), 3, plugin_dir_path(__FILE__)."/debug.log");

    // Check if we're trying to access an enabled signup page
    if (!FVSignupOptions::is_enabled_page($query->query['name'])) return;

    // Save page adress for later
    self::$current_slug = $query->query['name'];
    // Go to the signup page
    $query->query_vars['name'] = FVSignupOptions::default_page();
    
    // Variables needed for correct template
    $query->is_page = 1;
    $query->is_single = '';

    // Correct the url for WPML language selector
    add_filter('wpml_ls_language_url', function($url) {
      // Replace slug of default page with slug of actual page
      return str_replace(FVSignupOptions::default_page(), self::$current_slug, $url);
    });

    // Change page content so people know the signup is available
    // NOTE: all this is cleared when the Javascript is loaded
    add_filter('the_content', function($content) {
      $content = 
        "<div class='signup-placeholder'>".
        "  <h1>Fastaval Signup</h1>".
        "  <h2>Loading signup plugin</h2>".
        "  <p>If this message doesn't go away, there might have been a script error.<br>".
        "  You may need to use a different browser and/or make sure javascript is enabled</p>".
        "</div>"
      ;
      return $content;
    });

    add_action('wp_enqueue_scripts', function() {
      $settings = get_option('fv_signup_options');
      $settings['lang'] = apply_filters( 'wpml_current_language', NULL );

      // Scripts
      wp_enqueue_script('fv-signup-script-main', plugin_dir_url(__FILE__)."scripts/main.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/main.js"));
      wp_localize_script('fv-signup-script-main', "fv_signup_settings", $settings);
      wp_enqueue_script('fv-signup-script-render', plugin_dir_url(__FILE__)."scripts/render.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/render.js"));
      wp_enqueue_script('fv-signup-script-event', plugin_dir_url(__FILE__)."scripts/event.js", array( 'jquery' ), filemtime(plugin_dir_path(__FILE__)."scripts/event.js"));

      // Load render scripts from Infosys
      wp_enqueue_script('fv-signup-script-infosys-render', $settings['infosys_url']."/js/signup/render.js?", array( 'jquery' ), rand());
      wp_enqueue_script('fv-signup-script-infosys-process', $settings['infosys_url']."/js/signup/preprocess.js", array( 'jquery' ), rand());

      // Styles
      wp_enqueue_style( 'fv-signup-styles-main', plugin_dir_url(__FILE__)."styles/main.css",'', filemtime(plugin_dir_path(__FILE__)."styles/main.css"));
    });
  }
}