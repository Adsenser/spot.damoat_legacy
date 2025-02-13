<?php
// s3client.php
require '/volume1/Damoat_WEB/spot.damoat.com/vendor/autoload.php';

use Aws\S3\S3Client;

function getS3Client() {
    static $client = null;
    
    if ($client === null) {
        $client = new S3Client([
            'version'     => 'latest',
            'region'      => 'region',
            'credentials' => [
                'key'    => '{key}',
                'secret' => '{secret}',
            ],
        ]);
    }

    return $client;
}
