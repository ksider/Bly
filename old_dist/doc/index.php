<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Документашичка</title>
    <meta name="description" content="My template">
    	<meta name="viewport" content="width=device-width, initial-scale=1">
	<!--[if lt IE 8]>
	<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
	<![endif]-->
	<!--[if lt IE 9]>
	<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
	
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!-- style -->
    <link rel="stylesheet" id="badge-css" href="less/style.css" type="text/css" media="all">
    <link href="https://fonts.googleapis.com/css?family=Pacifico|Roboto+Condensed:300,300i,400,400i,700,700i|Roboto+Mono:100,100i,300,300i,400,400i,500,500i,700,700i|Roboto:100,100i,300,300i,400,400i,500,500i,700,700i,900,900i&amp;subset=cyrillic" rel="stylesheet">
    <link rel="stylesheet" id="icon-css" href="../addons/icons/styles.css" type="text/css" media="all">
    <link rel="stylesheet" id="icon-css" href="https://cdn.jsdelivr.net/npm/rainbow-code@2.1.2/themes/css/github.min.css" type="text/css" media="all">
    

    
</head>
<body class="docs">

<div class="starter_text">
   <div class="instarter">
    <h1>Это генератор <span class="logo">бейджей</span></h1>
    <p>Генератор сделан для создания бейджей непосредственно в браузере без использования графического редактора. Для работы нужно просто взять список зарегестрированных людей в <a href="https://ru.wikipedia.org/wiki/JSON">JSON</a> формате и вставить сюда. Бейджи можно распечатать на простом офисном принтере или сохранить в PDF. Генератор использовался при подготовке конференции <a href="https://iam.ras.ru/conferences/">МКМК</a> в <a href="https://iam.ras.ru/conferences/forum/mkmk2016/">2016</a> и <a href="https://iam.ras.ru/conferences/forum/mkmk2017/">2017</a> году. Скрипт легко интегрируется с вордпресом.</p>

    <p class="cur">Скоро я обязательно напишу инструкцию, а пока все вопросы можно написать <a href="mailto:semenov.ne@gmail.com">мне</a>.</p>
  </div>  
</div>

<div class="doc_wrap">
<h2 id="setting">Управление</h2>
<p>Элементы блока управления:</p>
<ul>
    <li><i class="icon-android-done-all"></i> &mdash; выделить/снять выделение всех в списке</li>
    <li><i class="icon-invert"></i> &mdash; инвертировать выделение</li>
    <li><i class="icon-android-close"></i> &mdash; очистить область печати</li>
    <li><i class="icon-android-bulb"></i> &mdash; очистить кэш</li>
    <li><i class="icon-nuclear"></i> &mdash; очистить список людей</li>
</ul>



<h2 id="adding">Добавление списка людей</h2>
<p>Список людей можно добавить вставив JSON список в поле справа. JSON файл должен содержать данные используемые в шаблоне. Поле name &mdash; обязательно. Пример JSON</p>

<div class="code_show">
<pre><code data-language="json">{
 "name": "Валентинов Валентин Аликберович",
 "job": "ИГИЛ СО РАН"
}, 
{
 "name": "Алексеев Петр Константинович",
 "job": "ИНЭОС"
}</code></pre>
   
    <pre><code data-language="html">templ.html
<div class="badge_wrap">
    <div class="name">{{: name }}</div>
    <div class="job">{{: job }}</div>
</div>

forma.html
<fieldset>
    <input type="text" name="name" class="name" placeholder="Имя" value="">
    <input type="text" name="job" class="job" placeholder="Место работы" value="">
</fieldset>
</code></pre>
</div>


<h1>Сгенерировать список людей</h1>
<div class="table">
    <form action="" class="tojson">
       
       <fieldset id="head"><input type="text" value="name"><input type="text" value="job"></fieldset>
       
       <a id="addline">Cтроку</a> <a id="addhead">Поле</a> <a id="getinput">Результат</a>
    </form>
    
    <div class="inputJSON"></div>
</div>


<hr>

<h2 id="templates">Шаблоны</h2>
<p>Шаблоны лежат в папке /templates/, файлы каждого шаблона должны лежать в папке с названием латинскими буквами.</p>
<pre>/simple
       /setting.json
       /style.css
       /templ.html
       /forma.html
</pre>
<ul>
    <li>templ.html &mdash; файл разметки (<a href="https://www.jsviews.com/">jsRender</a>)</li>
    <li>style.css &mdash; файл стилей</li>
    <li>forma.html &mdash; разметка для формы</li>
</ul>

<p>Файл setting.json содержит название шаблона и ссылки на файлы шаблона</p>
<div class="code_show">
    <pre><code data-language="json">
            {
                "meta": {
                    "name": "Простой",
                    "template": "templ.html",
                    "styleuri": "style.css",
                    "forma": "forma.html"
                }
            }  
     </code></pre>
</div>

</div>

<!-- scripts -->
<script src="//cdn.jsdelivr.net/jquery/2.1.3/jquery.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/webfont/1.5.18/webfont.js"></script>
<script src="https://cdn.jsdelivr.net/combine/npm/rainbow-code@2.1.2/dist/rainbow.min.js,npm/rainbow-code@2.1.2/src/language/html.min.js,npm/rainbow-code@2.1.2/src/language/css.min.js,npm/rainbow-code@2.1.2/src/language/javascript.min.js,npm/rainbow-code@2.1.2/src/language/json.min.js"></script>
<script src="js/js.js"></script>

<script>
WebFont.load({
    google: {
    families: ['PT Sans:400,700,400italic,700italic', 'PT Mono:400', 'PT Serif:400,700,400italic,700italic','Pacifico']
    },
	timeout: 500
  });

</script>

<?php require('../metrika.php'); ?>
</body>
</html