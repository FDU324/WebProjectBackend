/**
 * Created by kadoufall on 2017/6/4.
 */

import {Moment, Friend, User, Comment} from './connectors';

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

                        return returnComments(momentID, username).then(comments => {
                            reMoment.comments = comments;
                            return Promise.resolve(reMoment);
                        }).catch(error => {
                            console.log('returnMoment returnComments', error);
                            reMoment.comments = [];
                            return Promise.resolve(reMoment);
                        });
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
                            let filterLikeUser = temLikeuser1.map(likeUser => {
                                if (likeUser === username) {
                                    return Promise.resolve(-1);
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
                                        return Promise.resolve(likeUser);
                                    } else {
                                        return Promise.resolve(-1);
                                    }
                                }).catch(error => {
                                    console.log(error);
                                    return Promise.resolve(-1);
                                });
                            });

                            return Promise.all(filterLikeUser).then((lk) => {
                                lk = JSON.parse(JSON.stringify(lk));
                                filterLikeUser = lk.filter(item => {
                                    return item !== -1;
                                });
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

                                    return returnComments(momentID, username).then(comments => {
                                        reMoment.comments = comments;
                                        return Promise.resolve(reMoment);
                                    }).catch(error => {
                                        console.log('returnMoment returnComments', error);
                                        reMoment.comments = [];
                                        return Promise.resolve(reMoment);
                                    });
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

/**
 * 根据username返回封装好返回的commentsList
 * 输入:  momentID为需要返回的commentsList的moment的id,username为查看该commentsList的用户的username
 * 返回:  若有查看权限，则返回封装后的commentsList；若无权限，返回[]
 */
function returnComments(momentID, username) {

    return Comment.findAll({
        where: {
            momentId: momentID
        },
    }).then(comments => {
        let temComments = comments.map(comment => {
            let commentUsername = comment.username;
            let commentToUsername = comment.to;

            // 自己参与的直接返回
            if (username === commentUsername || username === commentToUsername) {
                return Promise.resolve(comment);
            } else if (commentToUsername === '') {
                // to为空，另一个必须为自己的好友
                return Friend.findOne({
                    where: {
                        $or: [
                            {
                                first: username,
                                second: commentUsername
                            },
                            {
                                first: commentUsername,
                                second: username
                            }
                        ]
                    }
                }).then(friend => {
                    if (friend !== null) {
                        return Promise.resolve(comment);
                    } else {
                        return Promise.resolve(-1);
                    }
                });
            } else {
                // 参与的人必须都是自己的好友
                return Friend.findAll({
                    where: {
                        $or: [
                            {
                                first: username,
                                second: commentUsername
                            }, {
                                first: commentUsername,
                                second: username
                            }, {
                                first: username,
                                second: commentToUsername
                            }, {
                                first: commentToUsername,
                                second: username
                            }
                        ]
                    }
                }).then(friends => {
                    // 应该返回两个字段
                    if (friends === null) {
                        return Promise.resolve(-1);
                    }

                    if (friends.length <= 1) {
                        return Promise.resolve(-1);
                    } else {
                        return Promise.resolve(comment);
                    }
                }).catch(error => {
                    console.log(error);
                    return Promise.resolve(-1);
                });
            }
        });

        return Promise.all(temComments).then((t) => {
            t = JSON.parse(JSON.stringify(t));
            temComments = t.filter(item => {
                return item !== -1;
            });

            let re = temComments.map(comment => {
                let returnComment = {
                    momentId: comment.momentId,
                    content: comment.content,
                    time: comment.time,
                    id: comment.id
                };

                // 补全user和to的信息
                return User.findOne({
                    where: {username: comment.username},
                    attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                }).then(user => {
                    returnComment.user = user;

                    return User.findOne({
                        where: {username: comment.to},
                        attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                    }).then(user => {
                        returnComment.to = user;

                        return returnComment;
                    }).catch(error => {
                        console.log('returnComments:', error);
                    });
                }).catch(error => {
                    console.log('returnComments:', error);
                });
            });

            return Promise.all(re).then((r) => {
                return Promise.resolve(r);
            }).catch(error => {
                console.log('returnComments:', error);
            });
        });
    });
}


export {returnMoment, returnComments};
