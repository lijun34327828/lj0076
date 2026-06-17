@echo off
echo ========================================
echo   社区水果店销售统计看板 - 启动脚本
echo ========================================
echo.

echo [1/3] 检查并安装后端依赖...
cd backend
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
) else (
    echo 后端依赖已存在
)
cd ..

echo.
echo [2/3] 检查并安装前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
) else (
    echo 前端依赖已存在
)
cd ..

echo.
echo [3/3] 启动服务...
echo.
echo 后端服务地址: http://localhost:8846
echo 前端看板地址: http://localhost:3841
echo.
echo 按 Ctrl+C 停止所有服务
echo.

start "后端服务 - 端口8846" cmd /k "cd backend && npm start"
start "前端服务 - 端口3841" cmd /k "cd frontend && npm start"

timeout /t 3 /nobreak >nul
start "" http://localhost:3841
