(function () {
    let currentPage  = 1;
    let currentQuery = '';
    const LIMIT = 25;
    const DEFAULT_COVER = '/images/default-cover.svg';

    const bookResults = document.getElementById('book-results');
    const searchInput = document.getElementById('search-input');
    const searchBtn   = document.getElementById('search-btn');
    const showMoreBtn = document.getElementById('show-more');

    function stockBadge(book) {
        if (book.availableStock === 0) {
            return `<span style="background:#fdecea;color:#c0392b;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;">Out of Stock</span>`;
        } else if (book.availableStock <= 2) {
            return `<span style="background:#fff3e0;color:#e67e22;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;">Only ${book.availableStock} left</span>`;
        }
        return `<span style="background:#eafaf1;color:#27ae60;padding:3px 8px;border-radius:12px;font-size:12px;">Available (${book.availableStock})</span>`;
    }

    function borrowBtn(book) {
        if (book.availableStock === 0) {
            return `<div class="book-actions"><button type="button" class="btn-borrow btn-borrow-disabled" disabled>Out of Stock</button></div>`;
        }
        return `
            <div class="book-actions">
                <form action="/borrow" method="POST">
                    <input type="hidden" name="book_id"   value="${book.book_id}"/>
                    <input type="hidden" name="book_name" value="${escapeHtml(book.title)}"/>
                    <button type="submit" class="btn-borrow">Borrow</button>
                </form>
            </div>`;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function coverImg(book) {
        const src = book.cover_image || DEFAULT_COVER;
        return `<img src="${src}" alt="Cover of ${escapeHtml(book.title)}"
                     onerror="this.onerror=null;this.src='${DEFAULT_COVER}'"
                     style="width:80px;height:120px;object-fit:cover;border-radius:4px;flex-shrink:0;"/>`;
    }

    function renderBooks(books, reset) {
        if (reset) bookResults.innerHTML = '';
        if (books.length === 0 && reset) {
            bookResults.innerHTML = '<p style="text-align:center;padding:20px;color:#777;">No books found.</p>';
            return;
        }
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.innerHTML = `
                <div style="display:flex;gap:15px;flex:1;">
                    ${coverImg(book)}
                    <div class="book-details">
                        <div class="book-title">${escapeHtml(book.title)}</div>
                        <div class="book-info"><strong>Author:</strong> ${escapeHtml(book.author || 'N/A')}</div>
                        <div class="book-info"><strong>Publisher:</strong> ${escapeHtml(book.publisher || 'N/A')}</div>
                        <div class="book-info"><strong>Year:</strong> ${book.published_year || 'N/A'}</div>
                        <div class="book-info"><strong>Book ID:</strong> ${book.book_id}</div>
                        <div style="margin-top:6px;">${stockBadge(book)}</div>
                    </div>
                </div>
                ${borrowBtn(book)}`;
            bookResults.appendChild(card);
        });
    }

    function fetchBooks(reset) {
        fetch(`/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=${LIMIT}`)
            .then(async (res) => {
                const data = await res.json();
                if (res.status === 401) {
                    window.location.href = '/login';
                    return null;
                }
                return data;
            })
            .then(data => {
                if (!data) return;
                if (!data.success) return;
                renderBooks(data.books, reset);
                showMoreBtn.style.display = data.hasMore ? 'block' : 'none';
            })
            .catch(err => console.error('Fetch error:', err));
    }

    searchBtn.addEventListener('click', () => {
        currentQuery = searchInput.value.trim();
        currentPage  = 1;
        fetchBooks(true);
    });

    searchInput.addEventListener('keyup', e => {
        if (e.key === 'Enter') searchBtn.click();
    });

    showMoreBtn.addEventListener('click', () => {
        currentPage++;
        fetchBooks(false);
    });

    // Auto-load on page open
    fetchBooks(true);
})();
