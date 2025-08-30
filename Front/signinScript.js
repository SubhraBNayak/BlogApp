/*
    signup() function takes the email and password as the input,
    and creates a new dictionary in the users collection of blog-app-database.
*/
async function signup() {
    const email = document.getElementById("signup-email").value
    const password = document.getElementById("signup-password").value
    const confirmpassword = document.getElementById("signup-confirmpassword").value

    if (email && password && confirmpassword) {
        if (password == confirmpassword) {
            try {
                const response = await axios.post("http://localhost:3000/api/signup", {
                    email: email,
                    password: password
                })
                if (response.status == 200) {
                    showToast("signin successful")
                    localStorage.setItem('token', response.data.token);
                    window.location.href = "mainPage.html";   // keeps history (back button works)
                }
            } catch (error) {
                if (error.response) {
                    if (error.response.status == 400) {
                        showToast("wrong email")
                    } else if (error.response.status == 500) {
                        showToast("bad response from server ")
                    } else if (error.response.status == 409) {
                        showToast("user already exists! ")
                    } else {
                        showToast("unknown error")
                    }
                } else {
                    showToast("server unreachable")
                }
            }
        } else {
            showToast("error- confirm password ")
            document.getElementById("signup-confirmpassword").value = "";
        }
    } else {
        showToast("email/pass not provided ")
    }
}

async function signin() {
    const email = document.getElementById("signin-email").value
    const password = document.getElementById("signin-password").value

    if (email && password) {
        try {
            const response = await axios.post("http://localhost:3000/api/signin", {
                email: email,
                password: password
            })
            if (response.status == 200) {
                localStorage.setItem("token", response.data.token)
                showToast("signin successful ")
                window.location.href = "mainPage.html"; 
            }
        }catch (error) {
            if (error.response.status == 404) {
                showToast("user doesn't exist! ")
            } else if (error.response.status == 401) {
                showToast("wrong password ")
            } else {
                showToast("unknown error ")
            }
        }    
    } else {
        showToast("email/pass not provided ")
    }
}

/*
    @publishBlog
    fetches token and blogPost from localStorage, then uses axios.post to send the 
    token and blogPost to the backend.
        status codes used -> 200, 404, 503
*/
async function publishBlog(){
    const token = localStorage.getItem('token');
    const blogPost = JSON.parse(localStorage.getItem('blogDraft')); // OBJECT
    try {
        const response = await axios.post("http://localhost:3000/publishBlog",{
            token : token,
            title : blogPost.title,
            content : blogPost.content,
            subtitle : blogPost.subtitle
        })
        if (response.status==200) {
            showToast("published! ")
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status==503) {
                showToast("server unreachable! ")
            }else if(error.response.status==404){
                showToast("user not found! ")
            }else{
                showToast("unknown error occured! ")
            }
        }else{
            showToast("no response from the server! ")
        }
    }
}