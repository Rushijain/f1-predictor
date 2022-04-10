$('#loginForm').on('submit', (e) => {
  e.preventDefault();

  let userId = $('#userId').val().trim();
  let password = $('#userPwd').val().trim();

  let data = {
    userId: userId,
    password: password
  };

  $.post("/login", data)
    .done(function(msg){
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("password", data.password);
      window.location.href = "/home";

    })
    .fail(function(xhr, status, error) {
      alert("Incorrect User Id or Password");
    });
});

function logout() {
  localStorage.setItem("userId", "");
  localStorage.setItem("password", "");
  window.location.href = "/";
}

function goHome() {
  window.location.href = "/home";
}