var mark;

// snipetts
function getLS(a) {
    return JSON.parse(localStorage.getItem(a));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function unique(arr) {
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        var str = arr[i];
        obj[str] = true; // запомнить строку в виде свойства объекта
    }
    return Object.keys(obj); // или собрать ключи перебором для IE8-
}

function getfile(link) {
    datafile = $.ajax({
        url: link,
        type: 'POST',
        cache: false,
        dataType: 'text',
        async: false,
        beforeSend: function() {
            console.log('начали');
        },
        complete: function(d) {
            console.log('Отправили');
        },
        success: function(data) {
            datafile = data;
        },
    }).responseText;
    return datafile;
}

// choose template
function loadTemplate(json) {
    data = JSON.parse(json);
    style = data.setting.meta;
    temldir = window.location.href + '/templates/' + data.name + '/';
    stylefile = temldir + style.styleuri;

    markup = getfile(temldir + data.setting.meta.template);
    forma = getfile(temldir + style.forma);
    style = getfile(stylefile);
    setTemplate(data.name, markup, style, forma);
}

function loadGist(json) {
    data = JSON.parse(json);
    console.log(data);
    gistid = data.gist_id;
    name = data.meta.slug;
    $.ajax({
        url: 'https://api.github.com/gists/' + gistid,
        type: 'GET',
        dataType: 'jsonp',

        beforeSend: function() {
            console.log('gist начали');
        },
        complete: function(d) {
            console.log('gist Отправили');
        },
        success: function(gistdata) {
            markup = gistdata.data.files['templ.html'].content;
            forma = gistdata.data.files['forma.html'].content;
            style = gistdata.data.files['style.css'].content;
            /* name = gistdata.data.description; */
            setTemplate(name, markup, style, forma);
        }

    });
}

function inlineTemplate() {
    forma = $('[name=genform]').val();
    style = $('[name=styleblock]').val();
    markup = $('[name=markup]').val();
    tma = 'allset';
    setTemplate(tma, markup, style, forma);
}

function setTemplate(tma, markup, style, forma) {
    if (tma == undefined) {
        tma = 'allset';
    }
    allSetting = {
        css: style,
        html: markup,
        form: forma
    };

    var getLs = getLS('mark');

    list = getLs || Array();
    list.unshift(tma);
    un = unique(list);
    localStorage.setItem('mark', JSON.stringify(un));

    localStorage.setItem(tma, JSON.stringify(allSetting));
    appliedTemplate(tma);
}

function appliedTemplate(tma) {
    if (tma == undefined) {
        tma = 'allset';
    }
    allset = getLS(tma);

    mark = allset['html'];
    css = allset['css'];
    form = allset['form'];

    $('.generate').html(form);
    $('#generatedstyle').html('').html(css);

    $('[name=genform]').val(form);
    $('[name=styleblock]').val(css);
    $('[name=markup]').val(mark);


    ganerate();
}

// user list
function addUserList(val) {
    localStorage.setItem('users', val);
}

function genUserForm() {
    list = getLS('users');
    $('#memberlist').html('');
    input = '';
    for (var key in list) {
        k = list[key];
        input += "<input type='checkbox' name='section[]' id='a" + key + "' value='" + key + "' class='sections' data-pid='" + key + "'><label for='a" + key + "'>" + k['name'] + "<a href='" + key + "' class='deleteu'>x</a><a href='" + key + "' class='editeu'>e</a></label>";
    }
    $('#memberlist').html(input);
    $('#memberlist').addClass('fulled');
}

function deleteuser(key) {
    list = getLS('users');
    list.splice(key, 1);
    localStorage.setItem('users', JSON.stringify(list));

    bages = getLS('badges');
    if (bages) {
        bkey = bages.indexOf(key);
        if (bkey != null) {

            bages.splice(bkey, 1);
            localStorage.setItem('badges', JSON.stringify(bages));
        }
    }
}

function edituser(key) {
    $("#edituser").remove();
    list = getLS('users');

    $("body").append('<div id="edituser"><div class="editabel"><textarea id="euser" class="textarea">' + JSON.stringify(list[key], null, 4) + '</textarea><a data-href="' + key + '" class="smbuser">save</a><a class="hideblock">hide</a></div></div>');
}

function saveuser(key) {
    list = getLS('users');
    jsn = $('#euser').val();
    list[key] = JSON.parse(jsn);
    localStorage.setItem('users', JSON.stringify(list));
    genUserForm();
    $("#edituser").remove();
}

function adduser(json) {
    //  list = getLS('users');
    console.log(json);
    if (getLS('users')) {
        list = getLS('users');
    } else {
        list = '';
    }
    list.push(JSON.parse(json));
    localStorage.setItem('users', JSON.stringify(list));

    genUserForm();
}


// Badges
function getlist() {
    user = $('input[type=checkbox].sections:checked');
    list = {};
    user.each(function(i) {
        n = $(this).data('pid');
        list[n] = $(this).val();
        addBagetoLS(list[n]);
    });
    return list;
}

function addBagetoLS(id) {
    var getLs = getLS('badges');
    list = getLs || Array();
    list.push(id);

    un = unique(list);
    localStorage.setItem('badges', JSON.stringify(un));
    $('.clearcash').addClass('full');
    return list;
}

function make() {
    getlist();
    ganerate();
}

function deletebadge(key) {
    list = getLS('badges');
    user = list[key];
    list.splice(key, 1);
    localStorage.setItem('badges', JSON.stringify(list));

    $("[value='" + user + "']").prop('checked', false);
}

// generate print

function makebadge(key) {
    badge = JSON.parse(JSON.stringify(getLS('users')[key]));

    template = $.templates(mark);
    bage = {
        'tp': template.render(badge),
        'id': key
    };
    return bage;
}

function bsize() {
    val = $(".badgesize:checked").val();
    label = $(".badgesize:checked + label").html();
    format_val = $(".alboom:checked").val();
    format_label = $(".alboom:checked + label").html();

    size = val.split('x');
    format = format_val.split('x');

    returnen = {
        'size': size,
        'format': format
    };

    $("#cursize").html(label);
    $("#formatsize").html(format_label);
    return returnen;
}

function ganerate() {

    dem = bsize();
    w = dem.format[0];
    h = dem.format[1];
    bw = dem.size[0];
    bh = dem.size[1];

    chunk = Math.floor(h / bh) * Math.floor(w / bw);

    list = getLS('badges');

    block = [];
    for (var key in list) {
        b = JSON.parse(list[key]);
        block.push(makebadge(b));
    }
    if (chunk >= 1) {
        returen = '';
        for (var i = 0, len = block.length; i < len; i += chunk) {
            thre = block.slice(i, i + chunk);
            returen += "<div class='a4' style='width:" + w + "mm;max-height:" + h + "mm'>";
            for (var g = 0, tlen = thre.length; g < tlen; g++) {
                returen += '<div class="badge" style="width:' + bw + 'mm;height:' + bh + 'mm;">';
                returen += '<a href="' + thre[g]['id'] + '" class="deleteB"></a>';
                returen += '<a href="' + thre[g]['id'] + '" class="editeu"></a>';
                returen += thre[g]['tp'];
                returen += '</div>';
            }
            returen += "</div>";
        }
    } else {
        returen = '<div class="a4"><div class="bage_error">Проблемы с размерами!</div></div>'
    }

    $('#printed').html(returen);
}