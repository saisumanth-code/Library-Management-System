(function () {
    let currentPage = 1;
    const LIMIT = 25;
    const DEFAULT_COVER = '/images/default-cover.svg';

    const bookResults = document.getElementById('book-results');
    const showMoreBtn = document.getElementById('show-more');
    const loading     = document.getElementById('loading');

    function stockBadge(book) {
        if (book.availableStock === 0)
            return `<span style="background:#fdecea;color:#c0392b;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;">Out of Stock</span>`;
        if (book.availableStock <= 2)
            return `<span style="background:#fff3e0;color:#e67e22;padding:3px 8px;border-radius:12px;font-size:12px;font-weight:bold;">Only ${book.availableStock} left</span>`;
        return `<span style="background:#eafaf1;color:#27ae60;padding:3px 8px;border-radius:12px;font-size:12px;">Available (${book.availableStock})</span>`;
    }

    function borrowBtn(book) {
        if (book.availableStock === 0)
            return `<div class="book-actions"><button type="button" class="btn-borrow btn-borrow-disabled" disabled>Out of Stock</button></div>`;
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

    function loadBooks() {
        loading.style.display     = 'block';
        showMoreBtn.style.display = 'none';

        fetch(`/search?q=&page=${currentPage}&limit=${LIMIT}`)
            .then(res => res.json())
            .then(data => {
                loading.style.display = 'none';

                if (!data.success || data.books.length === 0) {
                    if (currentPage === 1)
                        bookResults.innerHTML = '<p style="text-align:center;padding:20px;color:#777;">No books available.</p>';
                    showMoreBtn.style.display = 'none';
                    return;
                }

                data.books.forEach(book => {
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

                showMoreBtn.style.display = data.hasMore ? 'block' : 'none';
            })
            .catch(err => {
                loading.style.display = 'none';
                console.error('Error loading books:', err);
            });
    }

    showMoreBtn.addEventListener('click', () => {
        currentPage++;
        loadBooks();
    });

    loadBooks();
})();