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
      wp_enqueue_script('fv-signup-script', plugin_dir_url(__FILE__)."scripts/main.js",'', filemtime(plugin_dir_path(__FILE__)."scripts/main.js"));
    });
  }
}