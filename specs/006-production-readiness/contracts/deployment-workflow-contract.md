# Contract: GitHub Pages Deployment Workflow

**Contract ID**: `CTR-DEPLOY-001`
**Feature**: `006-production-readiness`

---

## 1. Action Versions & Security Constraints

Tệp `.github/workflows/pages.yml` BẮT BUỘC:
1. `actions/checkout@v4` (thay thế cho `actions/checkout@v6` không tồn tại).
2. `actions/setup-python@v5`.
3. `actions/setup-node@v4`.
4. `actions/configure-pages@v5`.
5. `actions/upload-pages-artifact@v4`.
6. `actions/deploy-pages@v4`.

---

## 2. Pre-Deployment Quality Gates

Trước khi thực hiện `actions/upload-pages-artifact@v4`, workflow BẮT BUỘC thực thi:
```yaml
      - name: Execute Full Regression Suite
        run: |
          node checks.cjs
          node checks-models.cjs
          node checks-perf.cjs
          node checks-learning.cjs
```
Nếu bất kỳ bài kiểm tra nào thất bại (mã thoát $\ne 0$), quá trình build BẮT BUỘC dừng lại và không đóng gói artifact phát hành.

---

## 3. Permissions & Least Privilege

```yaml
permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps: [...]
```
- Không chứa secret token hay deploy key trong code repository.
- Job `deploy` chỉ được kích hoạt khi job `build` kết thúc với trạng thái `success`.
