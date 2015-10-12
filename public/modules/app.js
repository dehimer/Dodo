define([
    'underscore',
    'backbone',
    'modules/virus'
], function(_, Backbone, Virus) {

    return {
        start: function() {

            var virus = new Virus({
                target: document.body,
                nodes: {
                    id: 0,
                    name: "user_0",
                    image: 'userpics/0.png'
                }
            });

            //тестовый блок (симуляция реальных данных)
            {
                var step_time = 2000,
                    progression = 2,
                    nodes_count = 1;

                //отправим новых пользователей
                {

                    var nodes = [];

                    //сгенерируем пользователей
                    _.each(_.range(5), function(user_num, index) {
                        var user_params = {
                            id: index + 1,
                            name: "user_" + (index + 1),
                            image: 'userpics/' + (index + 1) + '.jpg'
                        };

                        nodes_count += 1;
                        nodes.push(user_params);
                    });

                    //добавим
                    virus.trigger('add:nodes', nodes);



                    var addNewInt = setInterval(function() {
                        nodes_count += 1
                        virus.trigger('add:nodes', {
                            id: nodes_count,
                            name: "user_" + nodes_count,
                            image: 'userpics/' + nodes_count + '.jpg'
                        });

                        if(nodes_count > 6)
                        {
                            clearInterval(addNewInt);
                            addNewInt = null;
                        }
                    }, step_time)

                }



                // return;
                var linksnodes = {
                    data: {},
                    count: 0,
                    add: function(source, target) {

                        //если у источника нет ни одной связи
                        if (_.isUndefined(linksnodes.data[source])) {
                            linksnodes.count += 1;
                            //создать первую
                            linksnodes.data[source] = [target];
                        } else {
                            //если ещё такой связи нет
                            if (!linksnodes.check(source, target)) {
                                linksnodes.count += 1;
                                //добавить
                                linksnodes.data[source].push(target);
                            }
                        }
                    },
                    check: function(source, target) {
                        return (_.indexOf(linksnodes.data[source], target) >= 0);
                    }
                }

                //начальная связь
                var startlink = {
                    source: 0,
                    target: 1
                }
                virus.trigger('add:links', startlink)
                linksnodes.add(startlink.source, startlink.target);

                // console.log(linksnodes.data)


                //симуляция получения от сервера новых связей
                var victim_step_f = setInterval(function() {

                    var last_linksnodes_count = linksnodes.count;

                    //проходим по существующим связям
                    _.each(linksnodes.data, function(linksnodes_data) {

                        var rock = 50 * Math.random();
                        // console.log(rock);
                        if (true || rock > 45) {
                            //обходим концы
                            _.each(linksnodes_data, function(source_index, key) {
                                // console.log(source_index)
                                // console.log(key);
                                var rock = 50 * Math.random();
                                // console.log(rock);
                                if (true || rock > 40) {

                                    var new_victims = [];
                                    //выбираем новых жертв
                                    _.each(_.range(progression), function() {

                                        //случайная жертва из списка пользователей
                                        var victim_index = _.random(nodes_count - 1);
                                        // console.log(source_index+'->'+victim_index)
                                        //если не сами на себя и если такой связи ещё нет
                                        if (source_index != victim_index && !linksnodes.check(source_index, victim_index)) {
                                            // console.log('+')
                                            linksnodes.add(source_index, victim_index);

                                            new_victims.push({
                                                source: source_index,
                                                target: victim_index
                                            });

                                        }
                                    });

                                    virus.trigger('add:links', new_victims);
                                };
                            });
                        }

                    });


                    if (linksnodes.count === last_linksnodes_count && linksnodes.count > 1 || linksnodes.count > linksnodes.count*2 || linksnodes.count > 50) {
                        clearInterval(victim_step_f);

                        // console.log('removelink')
                        // alert('!')
                        virus.trigger('remove:links', [{
                            source: 0,
                            target: 1
                        }, {
                            source: 1,
                            target: 0
                        }])

                        setTimeout(function() {
                            virus.trigger('remove:links', [{
                                source: 1,
                                target: 2
                            }]);
                            virus.trigger('remove:links', [{
                                source: 2,
                                target: 1
                            }]);

                            // setTimeout(function () {
                            // 	virus.trigger('remove:nodes', [{id:1}, {id:2}])
                            // }, 1500);
                        }, 1000)

                    }
                }, step_time);
            }
        }
    };
});