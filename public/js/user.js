function onLogged() {
    $('.icon_header #signin-link').remove()
    $('.icon_header').append('<a href="/logout"><img src="img/signout.jpg"\n' +
        '                                           alt="выйти"></a>')

    window.location.reload()
}

(function ($) {
    $("#login-form-link").click(function (e) {
        $("#login-form").modal("show");
        $("#register-form").modal("hide");
        e.preventDefault();
    });

    $("#register-form-link").on("click", function (e) {
        $("#register-form").modal("show");
        $("#login-form").modal("hide");
        e.preventDefault();
    });

    $("#login-form").on("submit", function (e) {
        if (!e.isDefaultPrevented()) {
            let user = {
                id: $("#login-form input[type=email]").val(),
                password: $("#login-form input[type=password]").val()
            };
            $.ajax({
                type: "POST",
                url: "/login",
                data: user,
                success: function (data) {
                    console.log(data);
                    $("#login-form").modal("hide");
                    onLogged()
                },
                error: function (xhr) {
                    var alertBox = '<div class="alert alert-danger' +
                        ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + xhr.responseJSON.error + '</div>';
                    $('#login-form').find('.messages').html(alertBox);
                }
            });
            return false;
        }
    });

    $("#register-form").on("submit", function (e) {
        if (!e.isDefaultPrevented()) {
            let user = {
                id: $("#register-form input[type=email]").val(),
                password: $("#register-form #regPass").val(),
                passwordConfirm: $("#register-form #regPassConfirm").val()
            };
            $.ajax({
                type: "POST",
                url: "/register",
                data: user,
                success: function (data) {
                    console.log(data);
                    var alertBox = '<div class="alert alert-success' +
                        ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Вы успешно зарегестрированы</div> ' +
                        '<div class="form-group">\n' +
                        '                            <button class="btn btn-success btn-lg active" type="button" data-dismiss="modal" onclick="onLogged()">ОК\n' +
                        '                            </button>\n' +
                        '                        </div>';
                    $('#register-form').find('.messages').html(alertBox);
                    $('#register-form form').addClass("d-none");
                    $('#signin-link').addClass("d-none");
                },
                error: function (xhr) {
                    var alertBox = '<div class="alert alert-danger' +
                        ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + xhr.responseJSON.error + '</div>';
                    $('#register-form').find('.messages').html(alertBox);
                }
            });
            return false;
        }
    })
})(jQuery);