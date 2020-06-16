module.exports={
    plugins:[
        require("tailwindcss"),
        require("autoprefixer"),
        require("cssnano")({
            preset:'default'
        }),
        process.env.NODE_ENV === 'production'?
        require("@fullhuman/postcss-purgecss")({
            content:["./views/*.pug"],
            defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
        }):null
    ]
}