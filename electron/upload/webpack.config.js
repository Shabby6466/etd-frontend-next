const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const webpack = require("webpack")
const TerserPlugin = require("terser-webpack-plugin")

const isProduction = process.env.NODE_ENV === "production"

module.exports = {
  mode: isProduction ? "production" : "development",
  entry: path.resolve(__dirname, "src/index.tsx"),
  output: {
    path: path.resolve(__dirname, "build"),
    filename: isProduction ? "[name].[contenthash].js" : "bundle.js",
    publicPath: "/",
    clean: true,
  },
  devtool: isProduction ? "source-map" : "eval-source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
            configFile: path.resolve(__dirname, "tsconfig.json"),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "..", ".."),
      "react": path.resolve(__dirname, "../node_modules/react"),
      "react-dom": path.resolve(__dirname, "../node_modules/react-dom"),
      "process/browser": require.resolve("process/browser"),
      buffer: require.resolve("buffer/"),
    },
    fallback: {
      process: require.resolve("process/browser"),
      buffer: require.resolve("buffer/"),
      util: require.resolve("util"),
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      path: require.resolve("path-browserify"),
      fs: false,
      net: false,
      tls: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      inject: "body",
      minify: isProduction
        ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        }
        : false,
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
      "process.env": JSON.stringify(process.env),
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: { comments: false },
        },
        extractComments: false,
      }),
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"),
    },
    compress: true,
    port: 3004,
    host: "0.0.0.0",
    hot: true,
    historyApiFallback: true,
    open: true,
    allowedHosts: "all",
  },
  target: "web",
}

