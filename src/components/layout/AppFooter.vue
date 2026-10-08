<template>
  <footer class="footer">
    <div class="footer__row">
      <router-link to="/" class="footer__logo" aria-label="Kino XII home">
        KINO <span class="footer__logo-accent">XII</span>
      </router-link>
      <span class="footer__copyright">© 2026 Kino XII. All rights reserved.</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
// Sizes from the Figma footer on "Home_authorized": a 1px bg/raised line, 20px gap, then the row
.footer {
  padding: 27px 34px 34px;
  background: $bg-page;
}

.footer__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid $bg-raised;
}

// Button style: 14 ExtraBold
.footer__logo {
  color: $text-primary;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  text-decoration: none;
}

.footer__logo-accent {
  color: $color-red;
}

// Body/S: 12 Regular, 130%
.footer__copyright {
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.3;
}
</style>
