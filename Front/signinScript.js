/*
    (OK TESTED)
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

/*
    (OK TESTED)
    @signin() is a funcitno that takes email and password as input,
    sends them to the backend for user authentication.
        status codes used -> 200, 404, 401
*/
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
                updateBlog();
            }
        } catch (error) {
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
    (OK TESTED)
    @publishBlog
    fetches token and blogPost from localStorage, then uses axios.post to send the 
    token and blogPost to the backend.
        status codes used -> 200, 404, 503
*/
async function publishBlog() {
    const token = localStorage.getItem('token');
    const blogPost = JSON.parse(localStorage.getItem('blogDraft')); // OBJECT
    try {
        const response = await axios.post("http://localhost:3000/publishBlog", {
            token: token,
            title: blogPost.title,
            content: blogPost.content,
            subtitle: blogPost.subtitle
        })
        if (response.status == 200) {
            showToast("published! ")
            localStorage.setItem('blogDraft', '');
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status == 503) {
                showToast("server unreachable! ")
            } else if (error.response.status == 404) {
                showToast("user not found! ")
            } else {
                showToast("unknown error occured! ")
            }
        } else {
            showToast("no response from the server! ")
        }
    }
}

/*
    @updateBlog() is a function that calls itself, fetches the blogs from the backend 
    and appends it to the id="blogPostsContainer". we can use appendChild functionality
    to append the blogDiv to the page.
*/
async function updateBlog(currentIndex) {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post("http://localhost:3000/fetchBlog", {
            token: token,
            currentIndex : currentIndex++
        });
        if (response.status == 200) {
            const blog = response.data.blog;
            const title = blog.title;
            const subtitle = blog.subtitle;
            const content = blog.content;
            const username = blog.authorEmail.split("@")[0];
            const firstLetter = blog.authorEmail[0];
            const blogDiv = document.getElementById("blogPostsContainer")
            blogDiv.insertAdjacentHTML("beforeend", `
            <article class="blog-card" data-post-id="${blog._id}">
                <!-- Blog Header -->
                <div class="blog-header">
                    <div class="author-section">
                        <div class="author-avatar">
                            <span class="avatar-text">${firstLetter}</span>
                        </div>
                        <div class="author-info">
                            <div class="author-name">${username}</div>
                            <div class="post-meta">
                                <span class="post-date">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                                    </svg>
                                    Just now
                                </span>
                                <span class="reading-time">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                                    </svg>
                                    ${Math.ceil(content.split(' ').length / 200)} min read
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Blog Content -->
                <div class="blog-content">
                    <h2 class="blog-title">${title}</h2>
                    ${subtitle ? `<p class="blog-subtitle">${subtitle}</p>` : ''}
                    <div class="blog-excerpt">
                        ${content.length > 200 ? content.substring(0, 200) + '...' : content}
                    </div>
                </div>

                <!-- Blog Actions -->
                <div class="blog-actions">
                    <div class="engagement-buttons">
                        <button class="action-btn like-btn" data-post-id="${blog._id}" title="Like this post">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10.08L23,10M1,21H5V9H1V21Z"/>
                            </svg>
                            <span class="action-count">${blog.likeCounter || 0}</span>
                        </button>

                        <button class="action-btn dislike-btn" data-post-id="${blog._id}" title="Dislike this post">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M19,15H23V3H19V15M15,3H6C5.17,3 4.46,3.5 4.16,4.22L1.14,11.27C1.05,11.5 1,11.74 1,12V14A2,2 0 0,0 3,16H9.31L8.36,20.57C8.34,20.67 8.33,20.78 8.33,20.89C8.33,21.3 8.5,21.68 8.77,21.95L9.83,23L16.41,16.42C16.78,16.05 17,15.55 17,15V5A2,2 0 0,0 15,3Z"/>
                            </svg>
                            <span class="action-count">${blog.dislikeCounter || 0}</span>
                        </button>

                        <button class="action-btn comment-btn" data-post-id="${blog._id}" title="View comments">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,0 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22H9Z"/>
                            </svg>
                            <span class="action-count">${blog.commentCounter || 0}</span>
                        </button>
                    </div>

                    <div class="secondary-actions">
                        <button class="action-btn bookmark-btn" data-post-id="${blog._id}" title="Bookmark this post">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"/>
                            </svg>
                        </button>

                        <button class="action-btn share-btn" data-post-id="${blog._id}" title="Share this post">
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M25,12L20.5,7.5L19.08,8.92L22.16,12L19.08,15.08L20.5,16.5L25,12M19,19H5V5H12V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                            </svg>
                        </button>

                        <button class="action-btn read-more-btn" onclick="expandBlog('${blog._id}')" title="Read full post">
                            <span class="read-more-text">Read More</span>
                            <svg class="action-icon" viewBox="0 0 24 24">
                                <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `);
        showLoadMoreButton(blogs.length);
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status == 500) {
                showToast("server unreachable! ");
            } else if (error.response.status == 401) {
                showToast("User Authentication failed! ")
            }else if (error.response.status == 404){
                showToast("The End!")
            }
            else {
                showToast("unknown error occured! ");
            }
        } else {
        }
    }
}

// LOAD MORE FUNCTIONALITY
let totalBlogsLoaded = 0;
let currentPage = 1;
let isLoading = false;

function showLoadMoreButton(currentCount) {
    totalBlogsLoaded = currentCount;
    document.getElementById('totalBlogsCount').textContent = currentCount;
    document.getElementById('loadMoreSection').style.display = 'block';
    console.log("LoadMore button shown with count:", currentCount);
}

async function load10Blogs() {
    isLoading = false;
    if (isLoading) return;
    isLoading = true;
    for (let index = 0; index < 10 ; index++) {
        if (localStorage.getItem('currentIndex')) {
            // Show loading state
            document.querySelector('.load-more-content').style.display = 'none';
            document.querySelector('.load-more-loading').style.display = 'flex';
            const currentIndex = localStorage.getItem('currentIndex');
            await updateBlog(currentIndex);
            localStorage.setItem('currentIndex', currentIndex+1);
        }else{
            // Show loading state
            document.querySelector('.load-more-content').style.display = 'none';
            document.querySelector('.load-more-loading').style.display = 'flex';
            //initializing currentIndex if we don't have it 
            await updateBlog(-1);
            localStorage.setItem('currentIndex', 0);
        }
    }
    showToast("Done!");
    totalBlogsLoaded += 10;
    document.getElementById('totalBlogsCount').textContent = totalBlogsLoaded;
    
    // Restore button state
    document.querySelector('.load-more-content').style.display = 'flex';
    document.querySelector('.load-more-loading').style.display = 'none';    
}
