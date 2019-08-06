<?php

function get_content($URL){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    curl_setopt($ch, CURLOPT_URL, $URL);
    $data = curl_exec($ch);
    
  //   echo curl_error($ch);
    
    curl_close($ch);
    return $data;
}


$path = ltrim($_GET['path'], '/');

$domain = $_GET['domain'];

$delay = $_GET['delay'];

$cache_path = __DIR__ . '/../{staticDir}/';

if (!is_dir($cache_path)) {
    mkdir($cache_path, 0777, true);
}

// htaccess fix for default page

if (! $path || $path == '403.shtml') {
    $path = 'index';
}

$file_path = $cache_path . str_replace('/', '-', trim($path, '/')) . '.html';

if (file_exists($file_path)) {
    echo file_get_contents($file_path);

    // recache the content again
    send_response();
    load_content();
    die;
} else {
    load_content();
}

/**
 * Grab the content from the prerender
 *
 * @see https://stackoverflow.com/a/42245266/3380387
 * @return void
 */
function load_content()
{
    global $domain, $path, $delay, $file_path;

    $content = get_content("https://prerender.mentoor.io?domain=$domain&path=/$path&delay=$delay");

    echo $content;
    send_response();
    file_put_contents($file_path, $content);
}

/**
 * Send the response first then to run the pre render again
 */

function send_response()
{
    // check if fastcgi_finish_request is callable
    if (is_callable('fastcgi_finish_request')) {
        /*
         * This works in Nginx but the next approach not
         */
        session_write_close();
        fastcgi_finish_request();
    }

    ignore_user_abort(true);

    ob_start();
    $serverProtocole = filter_input(INPUT_SERVER, 'SERVER_PROTOCOL', FILTER_SANITIZE_STRING);
    header($serverProtocole.' 200 OK');
    header('Content-Encoding: none');
    header('Content-Length: '.ob_get_length());
    header('Connection: close');

    ob_end_flush();
    ob_flush();
    flush();
}