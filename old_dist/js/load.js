$(document).ready(function() {

    if (getLS('users')) {
        genUserForm();
        if (localStorage.getItem('badges')) {
            $('.clearcash').addClass('full');
            l = getLS('badges');

            for (k in l) {
                $("#a" + l[k]).prop('checked', true);
            }
        }
    } else {
        $('#openuser').prop('checked', true);
    }


    if (localStorage.getItem('mark')) {
        v = getLS('mark');
        appliedTemplate(v[0]);
    } else {
        inlineTemplate();
    }

    temllist = window.location.pathname + 'templates/manifest.json'; 
    temllist = 'templates/manifest.json';
    
    $.getJSON(temllist, function(data) {
        var opt = "";
        $.each(data, function(key, val) {
            name = val.meta.name;
            setting = val;
            opt += "<option value='" + JSON.stringify(setting) + "'>" + name + "</option>";
        });
        $('#template').append(opt);
    });


    $('#template').change(function() {
        if ($('#template').val() != 'none') {
            tname = $('#template').val();
            ch = JSON.parse(tname);
            if (getLS(ch.meta.slug)) {
                appliedTemplate(ch.meta.slug);
            } else {
                loadGist(tname);
            }
        } else {
            inlineTemplate();
        }
        ganerate();
    });

    $('#gistid').change(function() {
        json = '{"gist_id":"' + $(this).val() + '","meta":{"name":"Свой","slug":"self"}}';
        loadGist(json);
        ganerate();
    });


    $('.mark_submit').click(function() {
        inlineTemplate();
        ganerate();
    });

    $(document).on('click', '.editeu', function() {
        key = $(this).attr('href');
        edituser(key);
        return false;
    });

    $(document).on('click', '.smbuser', function() {
        key = $(this).attr('data-href');
        saveuser(key);
        ganerate();
        return false;
    });

    
    // Размера бейджа
    bsize();
    $(document).on('change', '.checksize', function() {
        bsize();
        ganerate();
    });

    $(".rel_size").click(function() {
        rel = $(this).attr('rel');
        val = $('.' + rel).val();
        hw = val.split('x');

        input = '<input id="custom' + val + '" type="radio" name="badgesize" class="badgesize" value="' + val + '"><label for="custom' + val + '" class="pure-radio">' + hw[0] + 'mm<i class="icon-ios-close-empty"></i>' + hw[1] + 'mm</label>';

        $('.edit_size').before(input);
        return false;
    });

    // создать
    $(".ser").click(function() {
        make();
        $('#openuser').prop('checked', false);
        return false;
    });

    // сгенерировать

    $(".get").click(function(event) {
        event.preventDefault();
        forma = $(this).attr('href');
        udata = $(forma).serializeArray();
        formData = {};
        for (var i in udata) {
            formData[udata[i].name] = udata[i].value;
        }
        formdata = JSON.stringify(formData);
        adduser(formdata);
        $('#openuser').prop('checked', true);
        $('#openader').prop('checked', false);

        return false;
    });

    $(".butch").click(function() {
        textarea = $(this).attr('href');
        newuserdata = $(textarea).val();
        udata = JSON.parse(newuserdata);

        if (getLS('users')) {
            list = getLS('users');
        } else {
            list = [];
        }
        newlist = list.concat(udata);
        localStorage.setItem('users', JSON.stringify(newlist));
        genUserForm();

        $('#openuser').prop('checked', true);
        $('#openader').prop('checked', false);

        return false;
    });

    // Удалить
    $(document).on('click', '.deleteB', function() {
        key = $(this).attr('href');
        deletebadge(key);
        ganerate();
        return false;
    });

    $(document).on('click', '.deleteu', function() {
        key = $(this).attr('href');
        deleteuser(key);
        genUserForm();
        ganerate();
        return false;
    });

    // helpers 

    $(".clear").click(function() {
        $('#printed').html('');
        return false;
    });

    $(".clearcash").click(function() {
        $('#printed').html('');
        localStorage.removeItem('badges');
        $('.clearcash').removeClass('full');

        v = getLS('mark');

        console.log(v);
        v.forEach(function(item, i, v) {
            localStorage.removeItem(item);
            console.log(item);
        });

        localStorage.removeItem('mark');

        // inlineTemplate();
        return false;
    });

    $(".clearlist").click(function() {
        $('#printed').html('');
        localStorage.removeItem('badges');
        localStorage.removeItem('users');
        $('.clearcash').removeClass('full');
        genUserForm();
        return false;
    });

    $("#checkAll").click(function() {
        $('.sections:checkbox').prop('checked', this.checked);
    });
    $("#invert").click(function() {
        $('input.sections[type="checkbox"]').each(function() {
            $(this).prop('checked', !$(this).is(':checked'));
        });
    });

    $(document).on('click', '.hideblock', function() {
        $('#edituser').remove();
        return false;
    });

    $(".reload").click(function() {
        ganerate();
    });

});