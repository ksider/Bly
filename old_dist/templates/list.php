<?php 
$dir = __DIR__;
$skip = array('.', '..');
$f = scandir($dir);

$sempl = "";
$context = stream_context_create($opts);

foreach ($f as $file){
   if(!in_array($file, $skip)) 
    if(is_dir($file)) {
     
        $setting = file_get_contents($dir.'/'.$file."/setting.json");
        $set = json_decode($setting);
        
          $sempl[] = array(
                "name"=>$file,
                "setting"=> $set,
            );
        
        
    }
}

echo json_encode($sempl, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
