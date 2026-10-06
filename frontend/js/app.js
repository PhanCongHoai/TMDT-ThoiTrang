// AURALIÈ Haute Couture - Official Website Logic
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Mobile Menu Drawer Toggle
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');

  if (mobileMenuToggle && mobileNavDrawer && drawerOverlay) {
    const openDrawer = () => {
      mobileNavDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      mobileNavDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileMenuToggle.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // 2. Mobile Search Overlay Toggle
  const mobileSearchToggle = document.getElementById('mobile-search-toggle');
  const bottomSearchTrigger = document.getElementById('bottom-search-trigger');
  const closeSearchBtn = document.getElementById('close-search-btn');
  const mobileSearchOverlay = document.getElementById('mobile-search-overlay');
  const mobileSearchInput = document.getElementById('mobile-search-input');

  if (mobileSearchOverlay) {
    const openSearch = (e) => {
      if (e) e.preventDefault();
      mobileSearchOverlay.classList.add('active');
      if (mobileSearchInput) mobileSearchInput.focus();
    };

    const closeSearch = () => {
      mobileSearchOverlay.classList.remove('active');
    };

    if (mobileSearchToggle) mobileSearchToggle.addEventListener('click', openSearch);
    if (bottomSearchTrigger) bottomSearchTrigger.addEventListener('click', openSearch);
    if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  }

  // 3. Mobile Filter Bottom Sheet Drawer Toggle
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  const closeFilterBtn = document.getElementById('close-filter-btn');
  const applyFilterBtn = document.getElementById('apply-filter-btn');
  const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
  const filterOverlay = document.getElementById('filter-overlay');

  if (mobileFilterToggle && mobileFilterDrawer && filterOverlay) {
    const openFilter = () => {
      mobileFilterDrawer.classList.add('open');
      filterOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeFilter = () => {
      mobileFilterDrawer.classList.remove('open');
      filterOverlay.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileFilterToggle.addEventListener('click', openFilter);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeFilter);
    if (applyFilterBtn) applyFilterBtn.addEventListener('click', closeFilter);
    filterOverlay.addEventListener('click', closeFilter);
  }

  // 4. Dynamic Category Filter & Product Grid Display
  const catLinks = document.querySelectorAll('.category-list a');
  const productCards = document.querySelectorAll('#product-grid-container .fashion-card');
  const catalogTitle = document.getElementById('catalog-title');
  const catalogSubtitle = document.getElementById('catalog-subtitle');

  // Dynamic counter updater
  const updateCategoryCounts = () => {
    const cards = document.querySelectorAll('#product-grid-container .fashion-card');
    const totalCount = cards.length;
    const catCounts = { 'all': totalCount };

    cards.forEach(card => {
      const cat = card.getAttribute('data-cat');
      if (cat) {
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    });

    document.querySelectorAll('.category-list a').forEach(link => {
      const cat = link.getAttribute('data-cat');
      const countBadge = link.querySelector('.category-count');
      if (countBadge && cat && catCounts[cat] !== undefined) {
        countBadge.textContent = catCounts[cat];
      }
    });
  };

  // Initial count update
  updateCategoryCounts();

  catLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const selectedCat = link.getAttribute('data-cat') || 'all';

      // Toggle active link class on ALL matching category links (both sidebar & mobile drawer)
      catLinks.forEach(l => {
        if (l.getAttribute('data-cat') === selectedCat) {
          l.classList.add('active');
        } else {
          l.classList.remove('active');
        }
      });

      const catNameSpan = link.querySelector('span:first-child');
      const catName = catNameSpan ? catNameSpan.textContent : 'Danh Mục';

      let visibleCount = 0;

      productCards.forEach(card => {
        const cardCat = card.getAttribute('data-cat');
        if (selectedCat === 'all' || cardCat === selectedCat) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Update Catalog Titles
      if (catalogTitle) {
        catalogTitle.textContent = selectedCat === 'all' ? 'Bộ Sưu Tập Nổi Bật' : `Danh Mục: ${catName}`;
      }
      if (catalogSubtitle) {
        catalogSubtitle.textContent = `Hiển thị ${visibleCount} sản phẩm thuộc danh mục "${catName}"`;
      }
    });
  });

  // Lookbook Collection Tabs Filtering (collections.html)
  const collectionTabBtns = document.querySelectorAll('.collection-tabs .tab-btn');
  if (collectionTabBtns.length > 0) {
    collectionTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        collectionTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterText = btn.textContent.trim().toLowerCase();
        const lookbookCards = document.querySelectorAll('main .fashion-card');

        lookbookCards.forEach(card => {
          if (filterText.includes('tất cả')) {
            card.style.display = 'flex';
          } else {
            const cardCatText = card.textContent.toLowerCase();
            if (cardCatText.includes(filterText) || cardCatText.includes(filterText.replace('phụ kiện luxury', 'túi'))) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          }
        });
      });
    });
  }

  // 5. Color Picker Filter Dots Selection
  const colorDots = document.querySelectorAll('.color-dot');
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      colorDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
    });
  });

  // 6. Size Filter Buttons Selection
  const sizeBtns = document.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 7. Add to Cart Interactive Counter & Notification Toast
  const cartCountElem = document.getElementById('cart-count');
  let currentCartCount = parseInt(cartCountElem ? cartCountElem.textContent : '3', 10);

  const addCartBtns = document.querySelectorAll('.btn-add-cart');
  addCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentCartCount++;
      if (cartCountElem) {
        cartCountElem.textContent = currentCartCount;
        cartCountElem.style.transform = 'scale(1.3)';
        setTimeout(() => {
          cartCountElem.style.transform = 'scale(1)';
        }, 200);
      }
      
      // Button Feedback
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã Thêm Giỏ Hàng!';
      btn.style.background = 'var(--accent-gold)';
      btn.style.color = '#fff';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
      }, 1500);
    });
  });

  // 8. Footer Accordion Mobile Toggle
  const collapsibleFooters = document.querySelectorAll('.collapsible-footer');
  collapsibleFooters.forEach(col => {
    const header = col.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          col.classList.toggle('open');
        }
      });
    }
  });

  // 9. Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // 10. PRODUCT DETAIL & REVIEWS MODAL LOGIC (HƯỚNG THỰC TẾ)
  const productModal = document.getElementById('product-detail-modal');
  const closeProductModalBtn = document.getElementById('close-product-modal');
  
  const modalMainImg = document.getElementById('modal-main-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalRatingVal = document.getElementById('modal-rating-val');
  const modalTag = document.getElementById('modal-product-tag');

  const modalTabBtns = document.querySelectorAll('.modal-tab-btn');
  const modalTabContents = document.querySelectorAll('.modal-tab-content');

  // Quantity Picker logic
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10) || 1;
      if (val < 10) qtyInput.value = val + 1;
    });
  }

  // Open Modal function
  const openProductModal = (card, focusTab = 'tab-reviews') => {
    if (!productModal) return;

    const title = card.getAttribute('data-title') || 'Sản phẩm Haute Couture';
    const category = card.getAttribute('data-category') || 'Thời trang cao cấp';
    const price = card.getAttribute('data-price') || '12.500.000 ₫';
    const rating = card.getAttribute('data-rating') || '4.9';
    const img = card.getAttribute('data-img') || 'assets/card_1.jpg';
    const desc = card.getAttribute('data-desc') || 'Sản phẩm thuộc bộ sưu tập Haute Couture độc quyền từ thương hiệu AURALIÈ.';

    if (modalTitle) modalTitle.textContent = title;
    if (modalCategory) modalCategory.textContent = category;
    if (modalPrice) modalPrice.textContent = price;
    if (modalRatingVal) modalRatingVal.textContent = rating;
    if (modalMainImg) modalMainImg.src = img;
    
    const modalDescElem = document.getElementById('modal-desc');
    if (modalDescElem) modalDescElem.textContent = desc;

    // Dynamic Secondary Attributes (Thuộc tính phụ sản phẩm)
    const catLower = category.toLowerCase();
    let defaultMaterial = '100% Cashmere Lụa Ý';
    let defaultFit = 'European Tailored Fit';
    let defaultLining = 'Lụa Cupro Thượng Hạng';
    let defaultHardware = 'Khuy Sừng / Khóa Mạ Vàng 18K';
    let defaultOrigin = 'Atelier AURALIÈ Đồng Khởi';
    let defaultSku = 'AUR-2026-VIP';

    if (catLower.includes('đầm') || catLower.includes('váy')) {
      defaultMaterial = '100% Lụa Tơ Tằm Bảo Lộc';
      defaultFit = 'Slim Evening Gown Cut';
      defaultLining = 'Lụa Chiffon Mềm Mại';
      defaultHardware = 'Đai Lưng Đính Đá Swarovsky';
      defaultOrigin = 'Atelier AURALIÈ Haute Couture';
      defaultSku = 'AUR-2026-GOWN';
    } else if (catLower.includes('khoác') || catLower.includes('len')) {
      defaultMaterial = 'Len Cashmere Thượng Hải 100%';
      defaultFit = 'Oversized Winter Capsule';
      defaultLining = 'Lớp Lót Dạ Hai Mặt';
      defaultHardware = 'Đai Da Bò Thật & Mạ Đồng';
      defaultOrigin = 'Atelier AURALIÈ Winter Craft';
      defaultSku = 'AUR-2026-COAT';
    } else if (catLower.includes('túi')) {
      defaultMaterial = 'Da Bò Thuộc Nâu / Da Đà Điểu';
      defaultFit = 'Structured Luxury Handbag';
      defaultLining = 'Da Cừu Nappa Siêu Mịn';
      defaultHardware = 'Khóa Kim Loại Mạ Vàng 18K';
      defaultOrigin = 'Chế Tác Thủ Công Tiêu Chuẩn Ý';
      defaultSku = 'AUR-2026-BAG';
    } else if (catLower.includes('giày') || catLower.includes('phụ kiện')) {
      defaultMaterial = 'Da Bê Ý / Kim Loại Mạ Vàng 18K';
      defaultFit = 'Ergonomic Luxury Craft';
      defaultLining = 'Lót Đệm Da Bò Êm Ái';
      defaultHardware = 'Khóa Mạ Vàng 18K Chống Khói';
      defaultOrigin = 'Atelier AURALIÈ Accessories';
      defaultSku = 'AUR-2026-ACC';
    }

    const material = card.getAttribute('data-material') || defaultMaterial;
    const fit = card.getAttribute('data-fit') || defaultFit;
    const lining = card.getAttribute('data-lining') || defaultLining;
    const hardware = card.getAttribute('data-hardware') || defaultHardware;
    const origin = card.getAttribute('data-origin') || defaultOrigin;
    const sku = card.getAttribute('data-sku') || (defaultSku + '-' + Math.floor(10 + Math.random() * 89));

    // Update main modal specs grid
    const attrMaterial = document.getElementById('attr-material');
    const attrFit = document.getElementById('attr-fit');
    const attrLining = document.getElementById('attr-lining');
    const attrHardware = document.getElementById('attr-hardware');
    const attrOrigin = document.getElementById('attr-origin');
    const attrSku = document.getElementById('attr-sku');

    if (attrMaterial) attrMaterial.textContent = material;
    if (attrFit) attrFit.textContent = fit;
    if (attrLining) attrLining.textContent = lining;
    if (attrHardware) attrHardware.textContent = hardware;
    if (attrOrigin) attrOrigin.textContent = origin;
    if (attrSku) attrSku.textContent = sku;

    // Update tab-details table
    const tabAttrMaterial = document.getElementById('tab-attr-material');
    const tabAttrFit = document.getElementById('tab-attr-fit');
    const tabAttrLining = document.getElementById('tab-attr-lining');
    const tabAttrHardware = document.getElementById('tab-attr-hardware');
    const tabAttrOrigin = document.getElementById('tab-attr-origin');
    const tabAttrSku = document.getElementById('tab-attr-sku');

    if (tabAttrMaterial) tabAttrMaterial.textContent = material;
    if (tabAttrFit) tabAttrFit.textContent = fit;
    if (tabAttrLining) tabAttrLining.textContent = lining;
    if (tabAttrHardware) tabAttrHardware.textContent = hardware;
    if (tabAttrOrigin) tabAttrOrigin.textContent = origin;
    if (tabAttrSku) tabAttrSku.textContent = sku;

    // Switch focus tab if specified
    switchModalTab(focusTab);

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeProductModal = () => {
    if (!productModal) return;
    productModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Tab switching helper
  const switchModalTab = (targetTabId) => {
    modalTabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    modalTabContents.forEach(content => {
      if (content.id === targetTabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  };

  // Event Listeners for Product Cards and Stars
  document.querySelectorAll('.product-clickable').forEach(card => {
    card.addEventListener('click', (e) => {
      // Check if user clicked add-to-cart button directly inside card
      if (e.target.closest('.btn-add-cart')) return;

      // If clicked star rating badge specifically
      if (e.target.closest('.open-reviews-btn')) {
        openProductModal(card, 'tab-reviews');
      } else {
        openProductModal(card, 'tab-reviews');
      }
    });
  });

  if (closeProductModalBtn) {
    closeProductModalBtn.addEventListener('click', closeProductModal);
  }

  if (productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target === productModal) closeProductModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && productModal.classList.contains('active')) {
        closeProductModal();
      }
    });
  }

  // Modal Header Tabs Clicking
  modalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchModalTab(targetTab);
    });
  });

  // Modal Rating Header Trigger Scroll / Focus to Reviews
  const ratingScrollTrigger = document.getElementById('modal-rating-scroll-trigger');
  if (ratingScrollTrigger) {
    ratingScrollTrigger.addEventListener('click', () => {
      switchModalTab('tab-reviews');
    });
  }

  // Color Swatch Selection inside Modal
  const modalColorDots = document.querySelectorAll('.modal-color-dots .color-dot');
  const modalSelectedColorText = document.getElementById('modal-selected-color');
  modalColorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      modalColorDots.forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      const colorName = dot.getAttribute('data-color') || 'Đen Tuyền';
      if (modalSelectedColorText) modalSelectedColorText.textContent = colorName;
    });
  });

  // Size Button Selection inside Modal
  const modalSizeBtns = document.querySelectorAll('.modal-size-btns .size-btn');
  const modalSelectedSizeText = document.getElementById('modal-selected-size');
  modalSizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalSizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (modalSelectedSizeText) modalSelectedSizeText.textContent = btn.textContent;
    });
  });

  // Modal Add to Cart Action
  const modalBtnAddCart = document.getElementById('modal-btn-add-cart');
  if (modalBtnAddCart) {
    modalBtnAddCart.addEventListener('click', () => {
      currentCartCount++;
      if (cartCountElem) {
        cartCountElem.textContent = currentCartCount;
        cartCountElem.style.transform = 'scale(1.3)';
        setTimeout(() => { cartCountElem.style.transform = 'scale(1)'; }, 200);
      }
      modalBtnAddCart.innerHTML = '<i class="fa-solid fa-check"></i> Đã Thêm Giỏ Hàng!';
      modalBtnAddCart.style.background = 'var(--accent-gold)';
      setTimeout(() => {
        modalBtnAddCart.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Thêm Vào Giỏ Hàng';
        modalBtnAddCart.style.background = '';
      }, 1800);
    });
  }

  // Toggle Write Review Form
  const toggleWriteReviewBtn = document.getElementById('toggle-write-review-btn');
  const writeReviewForm = document.getElementById('write-review-form');

  if (toggleWriteReviewBtn && writeReviewForm) {
    toggleWriteReviewBtn.addEventListener('click', () => {
      writeReviewForm.classList.toggle('hidden');
      if (!writeReviewForm.classList.contains('hidden')) {
        writeReviewForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Interactive Star Rating Selector in Review Form
  const starPicker = document.getElementById('form-star-picker');
  const starPickerLabel = document.getElementById('star-picker-label');
  let currentRatingScore = 5;

  if (starPicker) {
    const stars = starPicker.querySelectorAll('i');
    const ratingLabels = {
      1: '1/5 - Rất không hài lòng',
      2: '2/5 - Chưa hài lòng',
      3: '3/5 - BÌnh thường',
      4: '4/5 - Hài lòng',
      5: '5/5 - Tuyệt vời'
    };

    stars.forEach((star, idx) => {
      star.addEventListener('click', () => {
        currentRatingScore = idx + 1;
        stars.forEach((s, sIdx) => {
          if (sIdx <= idx) {
            s.classList.add('selected');
          } else {
            s.classList.remove('selected');
          }
        });
        if (starPickerLabel) starPickerLabel.textContent = ratingLabels[currentRatingScore];
      });
    });
  }

  // Dynamic Review Form Submission (Real-Time Review Append)
  if (writeReviewForm) {
    writeReviewForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const userName = document.getElementById('review-user-name').value.trim();
      const userComment = document.getElementById('review-user-comment').value.trim();

      if (!userName || !userComment) return;

      const reviewsList = document.getElementById('reviews-list');
      const modalTabCount = document.getElementById('modal-tab-count');
      const reviewCountBadge = document.getElementById('modal-review-count');

      // Generate Avatar Initials
      const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'KH';

      // Stars string
      let starsHTML = '';
      for (let i = 0; i < currentRatingScore; i++) {
        starsHTML += '<i class="fa-solid fa-star"></i>';
      }

      // Create new review element
      const newReviewItem = document.createElement('div');
      newReviewItem.className = 'review-item';
      newReviewItem.style.borderLeft = '3px solid var(--accent-gold)';
      newReviewItem.style.animation = 'fadeIn 0.5s ease';

      newReviewItem.innerHTML = `
        <div class="review-user-header">
          <div class="review-avatar gold-av">${initials}</div>
          <div class="review-user-info">
            <div class="review-user-name">${userName} <span class="verified-buyer"><i class="fa-solid fa-shield-check"></i> Vừa đánh giá</span></div>
            <div class="review-meta">Màu: ${modalSelectedColorText ? modalSelectedColorText.textContent : 'Đen Tuyền'} | Size: ${modalSelectedSizeText ? modalSelectedSizeText.textContent : 'M'} | Vừa xong</div>
          </div>
          <div class="review-stars-given">${starsHTML}</div>
        </div>
        <p class="review-text">${userComment}</p>
        <div class="review-actions">
          <button class="btn-helpful"><i class="fa-regular fa-thumbs-up"></i> Hữu ích (0)</button>
        </div>
      `;

      if (reviewsList) {
        reviewsList.prepend(newReviewItem);
      }

      // Update counter
      if (modalTabCount) {
        let count = parseInt(modalTabCount.textContent, 10) || 128;
        modalTabCount.textContent = count + 1;
        if (reviewCountBadge) reviewCountBadge.textContent = `(${count + 1} Đánh giá từ khách hàng)`;
      }

      // Reset form
      writeReviewForm.reset();
      writeReviewForm.classList.add('hidden');
      alert('Cảm ơn bạn đã gửi đánh giá! Đánh giá thực tế của bạn đã được xuất bản công khai.');
    });
  }

  // 11. User Profile Dropdown Toggle & Dynamic Role-Based Admin Link
  const userRole = localStorage.getItem('userRole');
  const userMenuTriggers = document.querySelectorAll('#user-menu-trigger');

  document.querySelectorAll('.user-dropdown-links').forEach(menu => {
    // Ensure any static admin link is removed for regular users
    const oldAdminItem = menu.querySelector('a[href="admin.html"]')?.closest('li');
    if (oldAdminItem) oldAdminItem.remove();

    // Only if logged in as ADMIN, dynamically inject the Admin Panel link
    if (userRole === 'ADMIN') {
      const logoutItem = menu.querySelector('.logout-link')?.closest('li');
      const adminLi = document.createElement('li');
      adminLi.innerHTML = `<a href="admin.html" style="color: var(--accent-gold); font-weight: bold;"><i class="fa-solid fa-user-shield"></i> Bảng Quản Trị Admin</a>`;
      if (logoutItem) {
        menu.insertBefore(adminLi, logoutItem);
      } else {
        menu.appendChild(adminLi);
      }
    }
  });

  // Logout handler to clear userRole
  document.querySelectorAll('.logout-link').forEach(logoutBtn => {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userRole');
    });
  });

  userMenuTriggers.forEach(trigger => {
    const dropdown = trigger.nextElementSibling;
    if (dropdown && dropdown.classList.contains('user-dropdown-menu')) {
      trigger.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          e.preventDefault();
          dropdown.classList.toggle('active');
        }
      });
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown-wrapper')) {
      document.querySelectorAll('.user-dropdown-menu').forEach(menu => menu.classList.remove('active'));
    }
  });

  // 12. Blog Category Tab Filtering (blog.html)
  const blogTabBtns = document.querySelectorAll('.blog-tab-btn');
  const blogPosts = document.querySelectorAll('.blog-post-item');

  if (blogTabBtns.length > 0) {
    blogTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        blogTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const selectedCat = btn.getAttribute('data-blog-cat') || 'all';

        blogPosts.forEach(post => {
          const postCat = post.getAttribute('data-category');
          if (selectedCat === 'all' || postCat === selectedCat) {
            if (post.classList.contains('blog-featured-card')) {
              post.style.display = 'grid';
            } else {
              post.style.display = 'flex';
            }
            post.style.animation = 'fadeIn 0.4s ease';
          } else {
            post.style.display = 'none';
          }
        });
      });
    });
  }

});


