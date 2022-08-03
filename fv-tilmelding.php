<?php
/**
Plugin Name: Fastaval Tilmeldingsmodul
Plugin URI: TBA
Description: Modul til styring af tilmelding for Rolle- og Bræspilskongressen Fastaval
Version: 0.0.1
Author: Mikkel Westh, Mads Thy
Author URI: https://westh.it
 */

include "fv-tilmelding-options.php";

add_action( 'init', 'FVTilmelding::init' );
class FVTilmelding {
  static $current_slug;

  static function init() {
    FVTilmeldingOptions::init();
    add_action('pre_get_posts', 'FVTilmelding::pre_get_posts');
  }

  static function pre_get_posts(&$query) {
    // Only run on main query
    if (!$query->is_main_query()) return;
    //error_log("Query:".print_r($query, true), 3, plugin_dir_path(__FILE__)."/debug.log");

    // Check if we're trying to access an enabled signup page
    if (!FVTilmeldingOptions::is_enabled_page($query->query['name'])) return;

    // Save page adress for later
    self::$current_slug = $query->query['name'];
    // Go to the signup page
    $query->query_vars['name'] = FVTilmeldingOptions::default_page();
    
    // Variables needed for correct template
    $query->is_page = 1;
    $query->is_single = '';

    // Correct the url for WMPL language selector
    add_filter('wpml_ls_language_url', function($url) {
      // Replace slug of default page with slug of actual page
      return str_replace(FVTilmeldingOptions::default_page(), self::$current_slug, $url);
    });

    // Change page content so people know the signup is available
    add_filter('the_content', function($content) {
      $content = 
        "<h1>Fastaval Signup</h1>".
        "<h2>Loading signup plugin</h2>".
        "<p>If this message doesn't go away, there might have been a script error.<br>".
        "You may need to use a different browser and/or make sure javascript is enabled</p>"
      ;
      return $content;
    });

    //TODO add scripts to page
  }
}