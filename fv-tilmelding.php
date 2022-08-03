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


add_action('parse_request', 'fv_tilmelding_parse_request');
function fv_tilmelding_parse_request($wp) {
  // echo "<pre>";
  // var_dump($wp);
  // echo "</pre>";

  $setting = get_option('fv_tilmelding_option_name');
  if ($wp->request == $setting['tilmelding_url']) {
    $wp->query_vars = [
      "pagename" => $setting['post_name']
    ];

    //TODO add scripts to page
  }
}

FVTilmeldingOptions::init();