function addhead() {
    return '<input type="text" value="" >';
}

function addline() {
    innc = $('#head').html();
    return '<fieldset class="fdata">' + innc + '</fieldset>';
}



$(document).ready(function() {

    $("#addhead").click(function() {
        $('form fieldset').append(addhead());
    });

    $("#addline").click(function() {
        $(this).before(addline());
    });

    $("#getinput").click(function() {
        keys = [];
        $('#head input').each(function() {
            keys.push($(this).val());
        });
        console.log(keys);
        nearr = [];
        $(".fdata").each(function(i, el) {
            nearr[i] = {};
            $(el).find('input').each(function(c, f) {
                nearr[i][keys[c]] = $(f).val();
                console.log(c);
            });
        });

        json = JSON.stringify(nearr, null, 4);
        $(".inputJSON").html(json)

    });
});