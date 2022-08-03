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

FVTilmeldingOptions::init();

add_action('parse_request', 'fv_tilmelding_parse_request');
function fv_tilmelding_parse_request($wp) {
  // echo "<pre>";
  // var_dump($wp);
  // echo "</pre>";

  if (FVTilmeldingOptions::is_enabled_page($wp->request)) {
    $wp->query_vars = [
      "pagename" => FVTilmeldingOptions::default_page()
    ];

    //TODO add scripts to page
  }
}

