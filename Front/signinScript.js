src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.7/axios.min.js"

/*
    signup() function takes the email and password as the input,
    and creates a new dictionary in the users collection of blog-app-database.
*/
async function signup(){
    const email = document.getElementById("signup-email").value
    const password = document.getElementById("signup-password").value
    const confirmpassword = document.getElementById("signup-confirmpassword").value

    if (email && password && confirmpassword) {
        if (password == confirmpassword) {
            const response = await axios.post("/signup", {
                email : email,
                password : password
            })
            if (response.status == 200) {
                alert("sign-up successful");
            }else if(response.status == 400){
                alert("bad request, wrong/invalid email address sent by the user!");
            }else if(response.status == 500){
                alert("internal server error, no/bad response from the database");
            }else{
                alert("kuch to hua! par pta nhi kya hua");
            }
        }else{
            alert("confirm password doesn't match!");
            document.getElementById("signup-confirmpassword").value = "";
        }
    }else{
        alert("email or password not provided")
    }
}

async function signin(){
    const email = document.getElementById("signin-email").value
    const password = document.getElementById("signin-password").value

    if (email && password) {
        const response = await axios.post("/signin", {
            email : email,
            password : password
        })
        if (response.status == 200) {
            localStorage.setItem("token", response.data.token)
            alert("signin successful!Redirecting...")
        }else{
            alert("Invalid Credentials")
        }
    }else{
        alert("email or password not provided")
    }
}