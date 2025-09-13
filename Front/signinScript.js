// To store full blog data for the Read More/Less functionality
const blogDataStore = {};

/**
 * Initializes the main page on load.
 * - Decodes the JWT to display the user's email.
 * - Clears the blog index from the previous session.
 * - Loads the initial set of blogs.
 */
function initMainPage() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            document.getElementById('userEmail').textContent = payload.email;
        } else {
            window.location.href = "signin.html";
            return; // Stop execution if no token
        }
    } catch (e) {
        console.error("Failed to decode token or token is invalid:", e);
        showToast("Session invalid. Please sign in again.", "error");
        window.location.href = "signin.html";
        return; // Stop execution if token is bad
    }

    sessionStorage.removeItem('currentIndex');
    load10Blogs();
}


/* --- Authentication Functions --- */
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
                    showToast("Signup successful!")
                    localStorage.setItem('token', response.data.token);
                    window.location.href = "mainPage.html"; 
                }
            } catch (error) {
                if (error.response) {
                    if (error.response.status == 400) {
                        showToast("Invalid email format or domain.", "error")
                    } else if (error.response.status == 500) {
                        showToast("Server error. Please try again later.", "error")
                    } else if (error.response.status == 409) {
                        showToast("This email is already registered.", "warning")
                    } else {
                        showToast("An unknown error occurred.", "error")
                    }
                } else {
                    showToast("Server is unreachable.", "error")
                }
            }
        } else {
            showToast("Passwords do not match.", "error")
            document.getElementById("signup-confirmpassword").value = "";
        }
    } else {
        showToast("Please fill in all fields.", "warning")
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
                showToast("Signin successful!")
                window.location.href = "mainPage.html";
            }
        } catch (error) {
            if (error.response.status == 404) {
                showToast("User not found. Please sign up.", "error")
            } else if (error.response.status == 401) {
                showToast("Incorrect password.", "error")
            } else {
                showToast("An unknown error occurred.", "error")
            }
        }
    } else {
        showToast("Please provide email and password.", "warning")
    }
}

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
            showToast("Published successfully!")
            localStorage.setItem('blogDraft', '');
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status == 503) {
                showToast("Server is currently unavailable.", "error")
            } else if (error.response.status == 404) {
                showToast("User not found.", "error")
            } else {
                showToast("An unknown error occurred.", "error")
            }
        } else {
            showToast("No response from the server.", "error")
        }
    }
}


/* --- Blog Rendering and Interaction --- */

let theEnd = false; // Global flag to check if all blogs have been loaded.

/**
 * Creates the HTML string for a single blog card.
 * @param {object} blog The blog data object.
 * @returns {string} The HTML string for the blog card.
 */
function createBlogCardHTML(blog) {
    blogDataStore[blog._id] = blog; // Store full blog data for read more/less
    const { title, subtitle, content, authorEmail, _id } = blog;
    const username = authorEmail.split("@")[0];
    const firstLetter = authorEmail[0].toUpperCase();

    return `
    <article class="blog-card" data-post-id="${_id}">
        <div class="blog-header">
            <div class="author-section">
                <div class="author-avatar"><span class="avatar-text">${firstLetter}</span></div>
                <div class="author-info">
                    <div class="author-name">${username}</div>
                    <div class="post-meta">
                        <span class="post-date">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/></svg>
                            ${new Date(blog.createdAt).toLocaleDateString()}
                        </span>
                        <span class="reading-time">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/></svg>
                            ${Math.ceil(content.split(' ').length / 200)} min read
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="blog-content">
            <h2 class="blog-title">${title}</h2>
            ${subtitle ? `<p class="blog-subtitle">${subtitle}</p>` : ''}
            <div class="blog-excerpt">${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</div>
        </div>
        <div class="blog-actions">
            <div class="engagement-buttons">
                <button class="action-btn like-btn" data-post-id="${_id}" title="Like this post" onclick="likeUpdate('${_id}')">
                    <svg class="action-icon" viewBox="0 0 24 24"><path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10.08L23,10M1,21H5V9H1V21Z"/></svg>
                    <span class="action-count">${blog.likeCounter || 0}</span>
                </button>
                <button class="action-btn dislike-btn" data-post-id="${_id}" title="Dislike this post" onclick="dislikeUpdate('${_id}')">
                    <svg class="action-icon" viewBox="0 0 24 24"><path d="M19,15H23V3H19V15M15,3H6C5.17,3 4.46,3.5 4.16,4.22L1.14,11.27C1.05,11.5 1,11.74 1,12V14A2,2 0 0,0 3,16H9.31L8.36,20.57C8.34,20.67 8.33,20.78 8.33,20.89C8.33,21.3 8.5,21.68 8.77,21.95L9.83,23L16.41,16.42C16.78,16.05 17,15.55 17,15V5A2,2 0 0,0 15,3Z"/></svg>
                    <span class="action-count">${blog.dislikeCounter || 0}</span>
                </button>
                <button class="action-btn comment-btn" data-post-id="${_id}" title="View comments" onclick="showCommentModal('${_id}')">
                    <svg class="action-icon" viewBox="0 0 24 24"><path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,0 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22H9Z"/></svg>
                    <span class="action-count">${blog.commentCounter || 0}</span>
                </button>
            </div>
            <div class="secondary-actions">
                <button class="action-btn bookmark-btn" data-post-id="${_id}" title="Bookmark this post"><svg class="action-icon" viewBox="0 0 24 24"><path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"/></svg></button>
                <button class="action-btn share-btn" data-post-id="${_id}" title="Share this post"><svg class="action-icon" viewBox="0 0 24 24"><path d="M25,12L20.5,7.5L19.08,8.92L22.16,12L19.08,15.08L20.5,16.5L25,12M19,19H5V5H12V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/></svg></button>
                <button class="action-btn read-more-btn" onclick="expandBlog('${_id}')" title="Read full post">
                    <span class="read-more-text">Read More</span>
                    <svg class="action-icon" viewBox="0 0 24 24"><path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/></svg>
                </button>
            </div>
        </div>
    </article>
    `;
}

/**
 * Fetches a single blog from the backend and renders it on the page.
 */
async function updateBlog(currentIndex) {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post("http://localhost:3000/fetchBlog", {
            token: token,
            currentIndex: currentIndex
        });
        if (response.status === 200) {
            const blog = response.data.blog;
            const blogCardHTML = createBlogCardHTML(blog);
            document.getElementById("blogPostsContainer").insertAdjacentHTML("beforeend", blogCardHTML);
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status === 404) {
                theEnd = true; // No more blogs to load
            } else {
                 console.error("Error fetching blog:", error.response.data);
            }
        } else if (error.request) {
            console.error("Cannot reach the server to fetch blog.");
        }
    }
}

function expandBlog(blogId) {
    const blogCard = document.querySelector(`.blog-card[data-post-id="${blogId}"]`);
    if (!blogCard) return;
    const excerptDiv = blogCard.querySelector('.blog-excerpt');
    const readMoreBtn = blogCard.querySelector('.read-more-btn');
    const fullContent = blogDataStore[blogId]?.content;
    if (excerptDiv && readMoreBtn && fullContent) {
        excerptDiv.innerHTML = fullContent;
        readMoreBtn.querySelector('.read-more-text').textContent = 'Read Less';
        readMoreBtn.setAttribute('onclick', `collapseBlog('${blogId}')`);
    }
}

function collapseBlog(blogId) {
    const blogCard = document.querySelector(`.blog-card[data-post-id="${blogId}"]`);
    if (!blogCard) return;
    const excerptDiv = blogCard.querySelector('.blog-excerpt');
    const readMoreBtn = blogCard.querySelector('.read-more-btn');
    const fullContent = blogDataStore[blogId]?.content;
    if (excerptDiv && readMoreBtn && fullContent) {
        excerptDiv.innerHTML = `${fullContent.substring(0, 200)}${fullContent.length > 200 ? '...' : ''}`;
        readMoreBtn.querySelector('.read-more-text').textContent = 'Read More';
        readMoreBtn.setAttribute('onclick', `expandBlog('${blogId}')`);
    }
}


async function likeUpdate(blogId) {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post("http://localhost:3000/likeUpdate", {
            token: token,
            blogId: blogId
        });
        if (response.status === 200 || response.status === 203) {
            showToast("Post liked!", "success");
            const countSpan = document.querySelector(`.like-btn[data-post-id="${blogId}"] .action-count`);
            countSpan.textContent = parseInt(countSpan.textContent, 10) + 1;
        } else if (response.status === 201) {
            showToast("You've already liked this post.", "warning");
        }
    } catch (err) {
        showToast("Failed to like post.", "error");
    }
}

async function dislikeUpdate(blogId) {
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post("http://localhost:3000/dislikeUpdate", {
            token: token,
            blogId: blogId
        });
        if (response.status === 200 || response.status === 203) {
            showToast("Post disliked.", "success");
            const countSpan = document.querySelector(`.dislike-btn[data-post-id="${blogId}"] .action-count`);
            countSpan.textContent = parseInt(countSpan.textContent, 10) + 1;
        } else if (response.status === 201) {
            showToast("You've already disliked this post.", "warning");
        }
    } catch (err) {
        showToast("Failed to dislike post.", "error");
    }
}

/* --- Page Content Loading --- */
let isLoading = false;

function showLoadMoreButton(shouldShow) {
    const loadMoreSection = document.getElementById('loadMoreSection');
    if (loadMoreSection) {
        loadMoreSection.style.display = shouldShow ? 'flex' : 'none';
    }
}

async function load10Blogs() {
    if (isLoading || theEnd) return;
    isLoading = true;
    showLoadMoreButton(true);
    document.querySelector('.load-more-content').style.display = 'none';
    document.querySelector('.load-more-loading').style.display = 'flex';

    let initialIndex = Number(sessionStorage.getItem('currentIndex') || 0);

    for (let i = 0; i < 10; i++) {
        let currentIndex = initialIndex + i;
        await updateBlog(currentIndex);
        if (theEnd) {
            showToast("You've reached the end!", "warning");
            showLoadMoreButton(false);
            break;
        }
    }
    
    let newCurrentIndex = initialIndex + 10;
    sessionStorage.setItem('currentIndex', newCurrentIndex.toString());
    
    document.getElementById('totalBlogsCount').textContent = document.getElementById("blogPostsContainer").children.length;

    document.querySelector('.load-more-content').style.display = 'flex';
    document.querySelector('.load-more-loading').style.display = 'none';

    isLoading = false;
}

/**
 * Fetches and displays blogs written by the current user.
 */
async function fetchMyBlogs() {
    showLoading();
    document.getElementById('page-title').textContent = 'My Blogs';
    showLoadMoreButton(false);
    const blogContainer = document.getElementById('blogPostsContainer');
    blogContainer.innerHTML = ''; // Clear existing blogs

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post("http://localhost:3000/fetchMyBlogs", { token });
        if(response.data.blogs && response.data.blogs.length > 0) {
            response.data.blogs.forEach(blog => {
                blogContainer.innerHTML += createBlogCardHTML(blog);
            });
        } else {
            blogContainer.innerHTML = `<p style="text-align:center; color: var(--muted);">You haven't published any blogs yet.</p>`;
        }
    } catch (error) {
        showToast("Could not fetch your blogs.", "error");
        console.error(error);
    }
    hideLoading();
}

/**
 * Fetches and displays comments made by the current user.
 */
async function fetchMyComments() {
    showLoading();
    document.getElementById('page-title').textContent = 'My Comments';
    showLoadMoreButton(false);
    const blogContainer = document.getElementById('blogPostsContainer');
    blogContainer.innerHTML = ''; // Clear existing blogs
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post("http://localhost:3000/fetchMyComments", { token });
        const { blogs, allComments } = response.data;

        if(blogs && blogs.length > 0) {
            for(let i = 0; i < blogs.length; i++) {
                const blog = blogs[i];
                const comment = allComments[i];
                const blogCardHTML = createBlogCardHTML(blog);

                // Create a special wrapper for this view
                blogContainer.innerHTML += `
                    <div class="my-comment-card">
                        <div class="my-comment-quote"><p>${comment}</p></div>
                        ${blogCardHTML}
                    </div>
                `;
            }
        } else {
             blogContainer.innerHTML = `<p style="text-align:center; color: var(--muted);">You haven't made any comments yet.</p>`;
        }
    } catch (error) {
        showToast("Could not fetch your comments.", "error");
        console.error(error);
    }
    hideLoading();
}

/* --- Comment Modal Functions --- */
function showCommentModal(blogId) {
    const modalOverlay = document.getElementById('commentModalOverlay');
    const modal = document.getElementById('commentModal');
    modal.dataset.blogId = blogId; // Store the blogId on the modal
    modalOverlay.classList.add('visible');
    document.getElementById('commentTextarea').focus();
}

function hideCommentModal() {
    const modalOverlay = document.getElementById('commentModalOverlay');
    modalOverlay.classList.remove('visible');
    document.getElementById('commentTextarea').value = ''; // Clear textarea
    document.getElementById('commentModal').removeAttribute('data-blog-id');
}

async function postComment() {
    const modal = document.getElementById('commentModal');
    const blogId = modal.dataset.blogId;
    const content = document.getElementById('commentTextarea').value.trim();
    const token = localStorage.getItem('token');

    if (!content) {
        showToast("Comment cannot be empty.", "warning");
        return;
    }

    try {
        const response = await axios.post("http://localhost:3000/postComment", {
            token,
            blogId,
            content
        });
        if(response.status === 200) {
            showToast("Comment posted successfully!", "success");
            hideCommentModal();
            // Update the comment count on the UI
            const countSpan = document.querySelector(`.comment-btn[data-post-id="${blogId}"] .action-count`);
            countSpan.textContent = parseInt(countSpan.textContent, 10) + 1;
        }
    } catch (error) {
        showToast("Failed to post comment.", "error");
        console.error(error);
    }
}
