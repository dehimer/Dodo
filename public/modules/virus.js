define(['d3', 'backbone'], function(d3, backbone) {

    /*

        Модуль визуализации вирусных связей между пользователями.

        Зависимости:
            d3 - d3.js
            backbone
            _ - underscore.js

        Входные параметры (передаются в виде объекта параметров)
         
         target - целевой элемент, куда нужно вставить диаграмму (обязательный параметр)
         nodes  - список узлов (пользователей) (не обязательный параметр)
                  узел должен быть в виде {id:0, name:"user_0", image:'userpics/0.png'}
                  можно передать как один узел {}, так и массив узлов [{},{},...]


        События модуля

         add:nodes - добавление новых узлов  (пользователей)
                     один узел {} или массив узлов [{},{},...]
         add:links - добавление новых узлов (пользователей)
                     одна связь {} или массив связей [{},{},...]
                     связь имеет вид {source:0, target:1}.
                     значения - индексы в массиве пользователей
                     (тут надо сделать не индексы, а id пользователей (задача 17))

         remove:links - удаление связей
                        одна связь {} или массив связей [{},{},...]


        Список изменений/задач

         + - уже выполнено

         1.+     Проверять не на заражённость, а на существование такой связи.
         2.+     Использовать картинки вместо рандомного цвета.
         3.+     Перейти на require.js.
         4.+     Использовать события для общения с сервером.
         5.+     Передавать модулю в качестве параметра целевой элемент.
         6.+     Аватары в круге, круг как маска (http://jsfiddle.net/7DgUh/157/).
         7.+     Искра от источнику к приемнику (http://d3.artzub.com/wbca/) периодически.
         8.      Ограничить радиус размером полотна.
         9.      Описать интерфейс работы с модулем.
         10.+    Добавить округление аватаров для вновь добавленных узлов.
         11.+    Вынести ввод данных наружу (передавать пользователей/связи через сообщения).
         12.+    Передавать изображение пользователей в объекте.
         13.+    Вынести генерацию связей по шагу наружу. Добавлять связи по событию.
         14.+    Подготовку вывода вынести в render.
         15.+    Переотрисовку (обновление вида графика) вынести в refresh.
         16.+    Удаление связей.
         17.     В качестве значений связи использовать не индекс в массиве пользователей,
                  а id пользователя.

        

    */

    return function Virus(params) {

        console.assert(params.target, 'target is not attached');

        var self = this;

        _.extend(self, _.clone(backbone.Events));

        _.extend(self, {
            model: {
                data: {
                    nodes: [],
                    links: []
                },
                nodes: {
                    count: 0,
                    add: function(new_nodes) {

                        // console.log(new_nodes)
                        if (_.isArray(new_nodes)) {
                            _.each(new_nodes, function(new_node) {
                                self.model.data.nodes.push(_.clone(new_node));
                                self.model.nodes.count += 1;
                                self.view.recalc_avatar_size();
                            });
                        } else if (_.isObject(new_nodes)) {
                            self.model.data.nodes.push(_.clone(new_nodes));
                            self.model.nodes.count += 1;
                            self.view.recalc_avatar_size();
                        }
                        self.view.refresh();
                    },
                    remove: function(remove_nodes) {

                        if (_.isArray(remove_nodes)) {
                            _.each(remove_nodes, function(remove_node) {
                                for (var i = 0; i < self.model.data.nodes.length; i++) {
                                    if (self.model.data.nodes[i].id == remove_node.id) {
                                        self.model.data.nodes.splice(i, 1);
                                        break;
                                    }
                                }
                            });
                        } else if (_.isObject(remove_nodes)) {
                            for (var i = 0; i < self.model.data.nodes.length; i++) {
                                if (self.model.data.nodes[i].id == remove_nodes.id) {
                                    self.model.data.nodes.splice(i, 1);
                                    break;
                                }
                            }
                        }

                        //удалить все связи, удалённого узла
                        /*{
                            //получить все связи, в котором участвует
                            var remove_links = [];

                        }*/

                        self.view.refresh();
                    }
                },
                links: {
                    add: function(new_links) {

                        if (_.isArray(new_links)) {
                            _.each(new_links, function(new_link) {
                                self.model.data.links.push(_.clone(new_link));
                            });
                        } else if (_.isObject(new_links)) {
                            self.model.data.links.push(_.clone(new_links));
                        }

                        self.view.refresh();
                    },
                    remove: function(remove_links) {

                        if (_.isArray(remove_links)) {
                            _.each(remove_links, function(remove_link) {
                                for (var i = 0; i < self.model.data.links.length; i++) {
                                    if (self.model.data.links[i].source.index == remove_link.source && self.model.data.links[i].target.index == remove_link.target) {
                                        self.model.data.links.splice(i, 1);
                                        break;
                                    }
                                }
                            });
                        } else if (_.isObject(remove_links)) {
                            for (var i = 0; i < self.model.data.links.length; i++) {
                                if (self.model.data.links[i].source.index == remove_links.source && self.model.data.links[i].target.index == remove_links.target) {
                                    self.model.data.links.splice(i, 1);
                                    break;
                                }
                            }
                        }
                        self.view.refresh();
                    }
                },
                get_max_user_links_count: function() {
                    return self.model.nodes.count * (self.model.nodes.count - 1) + 1;
                }
            },
            view: {
                get_avatar_reducion_factor: function() {
                    return (params.avatar_reducion_speed ? params.avatar_reducion_speed : 1) * (self.model.nodes.count) + 2
                },
                avatar_size: 15,
                recalc_avatar_size: function() {
                    var s = (self.view.get_target_wh()[0] * self.view.get_target_wh()[1]);
                    var r = Math.sqrt((s / Math.PI) / self.model.nodes.count)
                        // console.log(r / 2)
                    self.view.avatar_size = r > 1000 ? 1 : r / 2;
                },
                target: params.target,
                get_target_wh: function() {

                    return [d3.select(self.view.target).style('width').replace("px", ""), d3.select(self.view.target).style('height').replace("px", "")];
                },
                render: function() {

                    //создаём полотно
                    self.view.svg = d3.select(self.view.target).append("svg:svg")
                        .attr("width", self.view.get_target_wh()[0])
                        .attr("height", self.view.get_target_wh()[1]);

                    self.view.defs = self.view.svg.append("svg:defs");

                    // alert(self.view.get_avatar_size())



                    self.view.defs.append('circle')
                        .attr('id', 'roundrect')
                        .attr('x', -self.view.avatar_size / 2)
                        .attr('y', -self.view.avatar_size / 2)
                        .attr('r', self.view.avatar_size / 2);

                    //маска на основе скругленного rect
                    self.view.defs.append('clipPath')
                        .attr('id', 'clip')
                        .append('use')
                        .attr('xlink:href', '#roundrect');


                    self.view.defs.append('filter')
                        .attr('id', 'css_blur')
                        .attr('x', '-50%')
                        .attr('y', '-50%')
                        .attr('width', '200%')
                        .attr('height', '200%')
                        .append('feGaussianBlur')
                            .attr('stdDeviation', 1);



                    var gradient = self.view.defs.append("svg:linearGradient")
                        .attr("id", "gradient")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "100%")
                        .attr("y2", "100%");

                    gradient.append("svg:stop")
                        .attr("offset", "0%")
                        .attr("stop-color", "#0c0")
                        .attr("stop-opacity", 1);

                    gradient.append("svg:stop")
                        .attr("offset", "100%")
                        .attr("stop-color", "#c00")
                        .attr("stop-opacity", 1);

                    var gradient2 = self.view.svg.append("svg:defs")
                        .append("svg:linearGradient")
                        .attr("id", "gradient2")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "100%")
                        .attr("y2", "100%");

                    gradient2.append("svg:stop")
                        .attr("offset", "0%")
                        .attr("stop-color", "#f90")
                        .attr("stop-opacity", 0.1);

                    gradient2.append("svg:stop")
                        .attr("offset", "100%")
                        .attr("stop-color", "#f00")
                        .attr("stop-opacity", 1);


                    var gradient_an = self.view.svg.append("svg:defs")
                        .append("svg:linearGradient")
                        .attr("id", "gradient_an")
                        .attr("fy", 0)
                        .attr("gradientTransform", "rotate(60 .5 .5)");

                    gradient_an.append("stop")
                        .attr("offset", 0)
                        .attr("stop-color", "#f1f1f1");

                    gradient_an.append("stop")
                        .attr("offset", .25)
                        .attr("stop-color", "#f15361")
                        .append("animate")
                        .attr("attributeName", "offset")
                        .attr("dur", "1s")
                        .attr("values", "0;1;0")
                        .attr("repeatCount", "indefinite");

                    gradient_an.append("stop")
                        .attr("offset", 1)
                        .attr("stop-color", "#f1f1f1");


                    //просто для визуального оценивания размеров полотна
                    self.view.svg.append('rect')
                        .attr('x', 0)
                        .attr('y', 0)
                        .attr("width", self.view.get_target_wh()[0])
                        .attr("height", self.view.get_target_wh()[1])
                        .attr('stroke', 'blue')
                        // .style("fill", "url(#gradient)")
                        .attr('fill-opacity', 0.5)
                        .attr('stroke-opacity', 0.8);

                    self.view.sparks.group = self.view.svg.append('g').attr('class', 'sparks');

                    //создаём сеть
                    var force = self.view.force = d3.layout.force();


                    force
                        .nodes(self.model.data.nodes)
                        .links(self.model.data.links)
                        .distance(1)
                        .charge(-3000)
                        .gravity(0.3)
                        .linkDistance(200)
                        .size(self.view.get_target_wh())
                        .start();

                    var nodes = force.nodes(),
                        links = force.links();

                    //настроим связи
                    var link = self.view.svg.selectAll("line.link")
                        .data(self.model.data.links);

                    link.enter().append("svg:line")
                        .attr("class", "link")
                        .attr("x1", function(d) {
                            return d.source.x;
                        })
                        .attr("y1", function(d) {
                            return d.source.y;
                        })
                        .attr("x2", function(d) {
                            return d.target.x;
                        })
                        .attr("y2", function(d) {
                            return d.target.y;
                        });

                    //настроим точки
                    var node = self.view.node = self.view.svg.selectAll("g.node")
                        .data(self.model.data.nodes);

                    // self.view.svg.selectAll("g.node").attr('r', self.view.get_avatar_size())
                    node.enter().append("svg:g")
                        .attr("class", "node")
                        .call(force.drag);

                    node.append('use')
                        // .attr('xlink:href', '#roundrect')
                        .attr('stroke-width', 2)
                        .attr('stroke', '#777');

                    node
                        .append("svg:image")
                        .attr('preserveAspectRatio', 'xMidYMid slice')
                        .attr('x', -self.view.avatar_size / 2)
                        .attr('y', -self.view.avatar_size / 2)
                        .attr('width', self.view.avatar_size)
                        .attr('height', self.view.avatar_size)
                        .attr("xlink:href", function(i) {
                            return i.image
                        })
                        .attr('clip-path', "url(#clip)")
                        .call(force.drag);

                    node.append("svg:text")
                        .attr("class", "nodetext")
                        .attr("dx", 16)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name
                        });


                    //параметры анимации связей
                    force.on("tick", function() {
                        link.attr("x1", function(d) {
                            return d.source.x;
                        })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });

                        node.attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    });
                },
                sparks: {
                    sparks: [],
                    add: function (params) {
                        
                        var newspark = {
                            links: params.links
                        };

                        //проходим по всем линиям
                        newspark.links.each( function(d, i){

                            var sourceid = d.source,
                                targetid = d.target;

                            var source = self.view.svg.select("#nodeid"+d.source),
                                target = self.view.svg.select("#nodeid"+d.target);

                            if(source.length && target.length)
                            {
                                
                                var intcount = 0;
                                var interval = setInterval(function () {

                                    source = self.view.svg.select("#nodeid"+sourceid);
                                    
                                    /*console.log(source)
                                    console.log(source[0])
                                    console.log(source[0][0])
                                    console.log(source.attr('transform'))*/
                                    var stopintcount = false;
                                    if(source && source[0] && source[0][0] && source.attr('transform'))
                                    {
                                        var sourcexy = d3.transform(source.attr('transform')).translate;

                                        //получить коордианты точки отправления и прибытия
                                        var lastrxy = {
                                            r:self.view.avatar_size/25,
                                            x:sourcexy[0],
                                            y:sourcexy[1]
                                        };

                                        // var color = Math.random()*360;
                                        // var color = (300+Math.random() * 60);
                                        // var color = (250+Math.random() * 110);
                                        var color = 360;

                                        var moveint = setInterval(function(){


                                            //(350+Math.random() * 10)
                                            // if(Math.random() > 0.8)
                                            // {
                                            //     color = 30;
                                            // }

                                            target = self.view.svg.select("#nodeid"+targetid);
                                            /*console.log(target)
                                            console.log(target[0])
                                            console.log(target[0].length)*/
                                            if(target && target[0] && target[0][0] && target.attr('transform'))
                                            {

                                            }
                                            else
                                            {
                                                target
                                                    .style('stroke', color)
                                                    .style('stroke-opacity', 1)
                                                    .transition()
                                                    .duration(1000)
                                                    .style('stroke-opacity', 0);
                                                clearInterval(moveint);
                                                moveint = null;
                                                return;
                                            }
                                            // console.log(target.attr('transform'))
                                            targetxy = d3.transform(target.attr('transform')).translate;

                                            var targetxy = {
                                                x:targetxy[0],
                                                y:targetxy[1]
                                            }
                                            // console.log(sourcexy)
                                            // console.log(targetxy)
                                            var offset = 0;

                                            lastrxy.x = lastrxy.x + (targetxy.x - lastrxy.x)/25;
                                            lastrxy.y = lastrxy.y + (targetxy.y - lastrxy.y)/25;

                                            // if()
                                            var dist = Math.sqrt(Math.pow(targetxy.x-lastrxy.x,2)+Math.pow(targetxy.y-lastrxy.y,2))
                                            // console.log( dist )
                                            if(dist < 30)
                                            {
                                                target
                                                    .style('stroke', color)
                                                    .style('stroke-opacity', 1)
                                                    .transition()
                                                    .duration(1000)
                                                    .style('stroke-opacity', 0);

                                                clearInterval(moveint);
                                                moveint = null;
                                                return;
                                            }

                                            var x1 = lastrxy.x+Math.random()*offset-offset/2;
                                            var y1 = lastrxy.y+Math.random()*offset-offset/2;

                                            // offset = 10+Math.random()*3;
                                            offset = 0;

                                            var x2 = x1+Math.random()*offset-offset/2;
                                            var y2 = y1+Math.random()*offset-offset/2;

                                            var dur = 1000*Math.random();


                                            self.view.sparks.group.append('circle')
                                                .attr('filter', 'url(#css_blur)') 
                                                .attr('r', lastrxy.r+Math.random()*1)
                                                .attr('cx', x1)
                                                .attr('cy', y1)
                                                // .style('stroke', 'white')
                                                .style('opacity',0.9)   
                                                .style("fill",function() {
                                                    return "hsl(" + color + ",100%,100%)";
                                                })
                                                .transition()
                                                .duration(dur)
                                                .attr('r',0)
                                                .attr('cx', x2)
                                                .attr('cy', y2)
                                                .style('opacity',0)
                                                .style("fill",function() {
                                                    return "hsl(" + color + ",100%,50%)";
                                                })
                                                .remove();
                                        }, 10);
                                        
                                    }
                                    else
                                    {
                                        stopintcount = true;
                                    }
                                    


                                    intcount += 1;
                                    if(intcount > 15 || stopintcount)
                                    {
                                        clearInterval(moveint);
                                        clearInterval(interval);
                                        interval = null;
                                    }
                                }, 2000);
                            };
                        });
                    }
                },
                refresh: function() {
                    // return;
                    var force = self.view.force,
                        nodes = force.nodes(),
                        links = force.links();

                    self.view.defs.selectAll('circle')
                        .attr('r', self.view.avatar_size / 2);


                    //ослабляем визуально уже существующую связь (todo)
                    self.view.svg.selectAll("line")
                        .style('stroke', '#ccc')
                        .style("opacity", 0.3);
                    
                    // console.log('resetcolor');
                    self.view.node.select("use")
                        .style('stroke', '#777');

                    // console.log('setnewcolor')
                    var link = self.view.svg.selectAll("line")
                        .data(links);

                    var enteredlinks = link.enter().insert("svg:line", "g.node")
                        .style('stroke', 'url(#gradient_an)')
                        .attr("class", "link");

                    self.view.sparks.add({links:enteredlinks});

                    link.exit().remove();



                    var node = self.view.svg.selectAll("g.node")
                        .data(self.model.data.nodes);

                    // alert(self.model.data.nodes.length)
                    var nodeEnter = node.enter().append("svg:g")
                        .attr("class", "node")
                        .call(force.drag);

                    nodeEnter
                        .attr('id', function(d){ return 'nodeid'+d.id; })
                        .append('use')
                        // .attr('xlink:href', '#roundrect')
                        .attr('stroke-width', 2)
                        .attr('stroke', '#777');


                    nodeEnter
                        .append("svg:image")
                        .attr('preserveAspectRatio', 'xMidYMid slice')
                        .attr("xlink:href", function(i) {
                            return i.image
                        })
                        .attr('clip-path', "url(#clip)")
                        .call(force.drag);

                    nodeEnter
                        .append("svg:text")
                        .attr("class", "nodetext")
                        .attr("dx", self.view.avatar_size / 2)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name
                        });

                    self.view.svg.selectAll("image")
                        .attr('x', -self.view.avatar_size / 2)
                        .attr('y', -self.view.avatar_size / 2)
                        .attr('width', self.view.avatar_size)
                        .attr('height', self.view.avatar_size)

                    // console.log(self.view.svg.selectAll('text.nodetext'))
                    self.view.svg.selectAll('text.nodetext')
                        .attr("dx", self.view.avatar_size / 2)


                    node.exit().remove();


                    force.on("tick", function() {



                        link
                            .attr("x1", function(d) {
                                return d.source.x;
                            })
                            .attr("y1", function(d) {
                                return d.source.y;
                            })
                            .attr("x2", function(d) {
                                return d.target.x;
                            })
                            .attr("y2", function(d) {
                                return d.target.y;
                            });


                        node.attr("transform", function(d) {
                            var r = self.view.avatar_size;
                            d.x = Math.max(r, Math.min(self.view.get_target_wh()[0] - r, d.x))
                            d.y = Math.max(r, Math.min(self.view.get_target_wh()[1] - r, d.y))
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    });


                    force
                        .distance(1)
                        .charge(-3000)
                    // .friction(0.5)
                    .gravity(0.3)
                        .linkDistance(self.view.avatar_size * 4)
                        .size(self.view.get_target_wh())
                        .start();
                },
                remove: function() {
                    if (self.view.svg) {
                        self.view.svg.remove();
                    }
                }
            },
            controller: {
                start: function() {

                    self.on('add:nodes', self.model.nodes.add, self);
                    self.on('remove:nodes', self.model.nodes.remove, self);

                    self.on('add:links', self.model.links.add, self);
                    self.on('remove:links', self.model.links.remove, self);

                    self.view.render();

                    if (params.nodes) {
                        self.model.nodes.add(params.nodes);
                    }

                    if (params.links) {
                        self.model.nodes.add(params.links);
                    }


                },
                stop: function() {
                    self.off('add:nodes', self.model.nodes.add, self);
                    self.off('remove:nodes', self.model.nodes.remove, self);

                    self.off('add:links', self.model.links.add, self);
                    self.off('remove:links', self.model.links.remove, self);
                }
            }
        });


        self.controller.start();
    }
})