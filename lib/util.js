/**
 * Created by kadoufall on 2017/6/4.
 */

import {Moment, Friend, User} from './connectors';


/**
 * 根据username返回封装好返回前台的moment
 * 输入:  momentID为需要返回的moment的id,username为查看该moment的用户的username
 * 返回:  若有查看权限，则返回封装后的moment；若无权限，返回-1
 */
function returnMoment(momentID, username) {
    let reMoment = {
        id: momentID
    };

    return Moment.findOne({
        where: {id: momentID},
    }).then(moment => {
        reMoment.type = moment.type;
        reMoment.time = moment.time;
        reMoment.text = moment.text;
        reMoment.like = false;
        reMoment.location = JSON.parse(moment.location);
        reMoment.emotion = JSON.parse(moment.emotion);
        reMoment.images = JSON.parse(moment.images);
        reMoment.group = JSON.parse(moment.group);
        reMoment.likeuser = JSON.parse(moment.likeuser);

        if (moment.username === username) {         // 自己的动态
            // 是否赞
            let love = reMoment.likeuser.some(member => {
                return member === username;
            });
            if (love) {
                reMoment.like = true;
            }

            // user信息
            return User.findOne({
                where: {username: username},
                attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location', 'groups']
            }).then(user => {
                reMoment.user = user;

                // group信息
                let temGroup1 = JSON.parse(moment.group);
                let temGroup2 = temGroup1.map(member => {
                    return User.findOne({
                        where: {username: member},
                        attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location', 'groups']
                    }).then(user => {
                        return user;
                    }).catch(error => {
                        console.log('getMoments:', error);
                    });
                });

                return Promise.all(temGroup2).then(data => {
                    reMoment.group = JSON.parse(JSON.stringify(data));

                    // likeuser信息
                    let temLikeuser1 = JSON.parse(moment.likeuser);
                    let temLikeuser2 = temLikeuser1.map(member => {
                        return User.findOne({
                            where: {username: member},
                            attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                        }).then(user => {
                            return user;
                        }).catch(error => {
                            console.log('getMoments:', error);
                        });
                    });

                    return Promise.all(temLikeuser2).then(data => {
                        reMoment.likeuser = JSON.parse(JSON.stringify(data));
                        return Promise.resolve(reMoment);
                    });
                });
            }).catch((err) => {
                console.log(err);
            });
        } else {      // 其他人的动态
            // 是否是好友
            let friendUserName = moment.username;
            return Friend.findOne({
                where: {
                    $or: [
                        {
                            first: username,
                            second: friendUserName
                        },
                        {
                            first: friendUserName,
                            second: username
                        }
                    ]
                }
            }).then(friend => {
                // console.log(friend !== null);
                if (friend !== null) {
                    let canSee = reMoment.group.some(member => {
                        return member === username;
                    });

                    if (moment.type === 'public' || canSee) {
                        // 是否赞
                        let love = reMoment.likeuser.some(member => {
                            return member === username;
                        });
                        if (love) {
                            reMoment.like = true;
                        }

                        // 隐藏group
                        reMoment.group = [];

                        // user信息
                        return User.findOne({
                            where: {username: friendUserName},
                            attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                        }).then(user => {
                            reMoment.user = user;

                            // 过滤出点赞中的相同好友
                            let temLikeuser1 = JSON.parse(moment.likeuser);
                            let filterLikeUser = temLikeuser1.filter(likeUser => {
                                if (likeUser.username === username) {
                                    return true;
                                }

                                return Friend.findOne({
                                    where: {
                                        $or: [
                                            {
                                                first: username,
                                                second: likeUser
                                            },
                                            {
                                                first: likeUser,
                                                second: username
                                            }
                                        ]
                                    }
                                }).then(friend => {
                                    if (friend !== null) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                });
                            });

                            return Promise.all(filterLikeUser).then(() => {
                                //console.log(filterLikeUser);

                                // likeuser信息
                                let temLikeuser = filterLikeUser.map(member => {
                                    return User.findOne({
                                        where: {username: member},
                                        attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                                    }).then(user => {
                                        return user;
                                    }).catch(error => {
                                        console.log('getMoments:', error);
                                    });
                                });

                                return Promise.all(temLikeuser).then(data => {
                                    reMoment.likeuser = JSON.parse(JSON.stringify(data));
                                    return Promise.resolve(reMoment);
                                });
                            });
                        }).catch((err) => {
                            console.log(err);
                        });
                    } else {
                        return Promise.resolve(-1);
                    }
                } else {
                    return Promise.resolve(-1);
                }
            });
        }

    }).catch(err => {
        console.log('returnMoment failed: ' + err);
        return Promise.resolve(err);
    });
}

export {returnMoment};
