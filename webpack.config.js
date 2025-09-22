const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    // Головний файл з якого починається збірка
    entry: {
      widget: './src/widget/index.js'
    },
    
    // Куди складати готові файли
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].min.js',
      clean: true,
      // ВИПРАВЛЕННЯ: експорт в глобальний scope
      library: {
        name: 'GewurzWidgetBundle',
        type: 'window'
      },
      globalObject: 'window'
    },
    
    // Як обробляти різні типи файлів
    module: {
      rules: [
        // JavaScript файли - конвертувати ES6 в ES5 для старих браузерів
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        
        // SCSS файли - компілювати в CSS + додавати префікси
        {
          test: /\.scss$/,
          use: [
            // Витягує CSS в окремий файл
            MiniCssExtractPlugin.loader,
            
            // Читає CSS файли
            'css-loader',
            
            // PostCSS обробка - тут додається префікс .gwz-widget
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    // Це основна магія - додає префікс до всіх селекторів
                    require('postcss-prefix-selector')({
                      prefix: '.gwz-widget', // Префікс
                      exclude: ['.gwz-widget'] // Не префіксувати сам контейнер
                    }),
                    // Додає вендорні префікси (-webkit-, -moz- і т.д.)
                    require('autoprefixer')
                  ]
                }
              }
            },
            
            // Компілює SCSS в CSS
            'sass-loader'
          ]
        },
        
        // Картинки та інші ресурси
        {
          test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        }
      ]
    },
    
    // Плагіни для додаткової обробки
    plugins: [
      // Витягує CSS в окремий файл widget.min.css
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].min.css' : '[name].css'
      }),
      
      // Створює chat.html з підключеними скриптами
      new HtmlWebpackPlugin({
        template: './src/chat/chat.html',
        filename: 'chat.html',
        chunks: [], // НЕ підключати widget.js в chat.html
        inject: false
      })
    ],
    
    // Режим розробки
    mode: isProduction ? 'production' : 'development',
    
    // Source maps для дебагу (тільки в dev режимі)
    devtool: isProduction ? false : 'eval-source-map',
    
    // Налаштування dev сервера - ВИПРАВЛЕНО
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      hot: true,
      port: 3000,
      open: true
    },
    
    // Оптимізація для продакшну
    optimization: {
      minimize: isProduction,
      // ВИПРАВЛЕННЯ: не розділяти код на chunks
      splitChunks: false
    }
  };
};
