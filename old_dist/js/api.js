var mark;

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
        obj[str] = true;
    }
    return Object.keys(obj);
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
        input += "<input type='checkbox' name='section[]' id='a" + key + "' value='" + key + "' class='sections' data-pid='" + key + "'><label for='a" + key + "'>" + k['name'] + "<a href='" + key + "' class='deleteu'>x</a></label>";
    }
    $('#memberlist').html(input);
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

function adduser(json) {
    list = getLS('users');
    list.push(JSON.parse(json));
    localStorage.setItem('users', JSON.stringify(list));

    $(".members_list").scrollTop = $(".members_list").scrollHeight;

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

    console.log(un);
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
    console.log('Мейкбейдж:' + badge);
    template = $.templates(mark);
    bage = {
        'tp': template.render(badge),
        'id': key
    };
    return bage;
}

function ganerate() {

    var format = $(".alboom:checked").val();
    var size = $(".badgesize:checked").val();

    if (format === 'album') {
        w = 270;
        h = 195;
    } else {
        w = 195;
        h = 270;
    }
    if (size === 'big') {
        bw = 110;
        bh = 70;
    } else if (size === 'micro') {
        bw = 85;
        bh = 50;
    } else {
        bw = 96;
        bh = 73;
    }
    chunk = Math.floor(h / bh) * Math.floor(w / bw);

    list = getLS('badges');

    console.log('Генерация:' + list);

    block = [];
    for (var key in list) {
        b = JSON.parse(list[key]);
        block.push(makebadge(b));
    }

    returen = '';
    for (var i = 0, len = block.length; i < len; i += chunk) {
        thre = block.slice(i, i + chunk);
        returen += "<div class='a4 " + format + " " + size + "'>";
        for (var g = 0, tlen = thre.length; g < tlen; g++) {
            returen += '<div class="badge">';
            returen += '<a href="' + g + '" class="deleteB"></a>';
            returen += thre[g]['tp'];
            returen += '</div>';
        }
        returen += "</div>";
    }
    $('#printed').html(returen);
}