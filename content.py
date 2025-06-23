from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
from models import Content, Episode, WatchHistory
from app import db
import logging

content_bp = Blueprint('content', __name__)

@content_bp.route('/movies')
def movies_list():
    page = request.args.get('page', 1, type=int)
    genre = request.args.get('genre')
    search = request.args.get('search')
    
    query = Content.query.filter_by(content_type='movie')
    
    if genre:
        query = query.filter(Content.genre.contains(genre))
    
    if search:
        query = query.filter(Content.title.contains(search))
    
    movies_list = query.order_by(Content.created_at.desc()).paginate(
        page=page, per_page=12, error_out=False
    )
    
    return render_template('movies_list.html', movies_list=movies_list, genre=genre, search=search)

@content_bp.route('/genres')
def genres():
    # Get all unique genres
    genres = db.session.query(Content.genre).distinct().all()
    genre_list = []
    for g in genres:
        if g[0]:
            # Split genres by comma and add to list
            for genre in g[0].split(','):
                clean_genre = genre.strip()
                if clean_genre and clean_genre not in genre_list:
                    genre_list.append(clean_genre)
    
    genre_list.sort()
    return render_template('genres.html', genres=genre_list)

@content_bp.route('/genre/<genre_name>')
def genre_content(genre_name):
    page = request.args.get('page', 1, type=int)
    
    content_list = Content.query.filter(Content.genre.contains(genre_name)).order_by(
        Content.created_at.desc()).paginate(page=page, per_page=12, error_out=False)
    
    return render_template('genre_content.html', content_list=content_list, genre_name=genre_name)

@content_bp.route('/anime')
def anime_list():
    page = request.args.get('page', 1, type=int)
    genre = request.args.get('genre')
    search = request.args.get('search')
    
    query = Content.query.filter_by(content_type='anime')
    
    if genre:
        query = query.filter(Content.genre.contains(genre))
    
    if search:
        query = query.filter(Content.title.contains(search))
    
    anime_list = query.order_by(Content.created_at.desc()).paginate(
        page=page, per_page=12, error_out=False
    )
    
    return render_template('anime_list.html', anime_list=anime_list, genre=genre, search=search)

@content_bp.route('/anime/<int:content_id>')
def anime_detail(content_id):
    anime = Content.query.get_or_404(content_id)
    episodes = Episode.query.filter_by(content_id=content_id).order_by(Episode.episode_number).all()
    
    # Get user's watch history if logged in
    user_progress = {}
    if current_user.is_authenticated:
        for episode in episodes:
            history = WatchHistory.query.filter_by(
                user_id=current_user.id,
                episode_id=episode.id
            ).first()
            if history:
                user_progress[episode.id] = {
                    'watch_time': history.watch_time,
                    'completed': history.completed
                }
    
    return render_template('anime_detail.html', anime=anime, episodes=episodes, user_progress=user_progress)

@content_bp.route('/watch/<int:episode_id>')
@login_required
def watch_episode(episode_id):
    episode = Episode.query.get_or_404(episode_id)
    content = episode.content
    
    # Check if user can watch this episode
    can_watch_full = current_user.can_watch_full_episode(episode.episode_number)
    max_watch_time = current_user.get_max_watch_time(episode.episode_number)
    
    # Get watch history
    watch_history = WatchHistory.query.filter_by(
        user_id=current_user.id,
        episode_id=episode_id
    ).first()
    
    if not watch_history:
        watch_history = WatchHistory(
            user_id=current_user.id,
            content_id=content.id,
            episode_id=episode_id
        )
        db.session.add(watch_history)
        db.session.commit()
    
    return render_template('video_player.html', 
                         episode=episode, 
                         content=content,
                         can_watch_full=can_watch_full,
                         max_watch_time=max_watch_time,
                         watch_history=watch_history)

@content_bp.route('/trailer/<int:content_id>')
def watch_trailer(content_id):
    content = Content.query.get_or_404(content_id)
    return render_template('trailer.html', content=content)

@content_bp.route('/api/update-progress', methods=['POST'])
@login_required
def update_watch_progress():
    data = request.get_json()
    episode_id = data.get('episode_id')
    watch_time = data.get('watch_time', 0)
    completed = data.get('completed', False)
    
    if not episode_id:
        return jsonify({'success': False, 'message': 'Episode ID required'})
    
    episode = Episode.query.get(episode_id)
    if not episode:
        return jsonify({'success': False, 'message': 'Episode not found'})
    
    # Check time limits for free users
    max_watch_time = current_user.get_max_watch_time(episode.episode_number)
    if max_watch_time and watch_time > max_watch_time * 60:  # Convert minutes to seconds
        return jsonify({'success': False, 'message': 'Watch time limit exceeded'})
    
    # Update or create watch history
    watch_history = WatchHistory.query.filter_by(
        user_id=current_user.id,
        episode_id=episode_id
    ).first()
    
    if not watch_history:
        watch_history = WatchHistory(
            user_id=current_user.id,
            content_id=episode.content_id,
            episode_id=episode_id
        )
        db.session.add(watch_history)
    
    watch_history.watch_time = watch_time
    watch_history.completed = completed
    watch_history.status = 'completed' if completed else 'on-going'
    watch_history.last_watched = db.func.now()
    
    try:
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logging.error(f"Error updating watch progress: {e}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to update progress'})

@content_bp.route('/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
    
    results = Content.query.filter(
        Content.title.contains(query)
    ).limit(10).all()
    
    return jsonify([{
        'id': content.id,
        'title': content.title,
        'type': content.content_type,
        'thumbnail': content.thumbnail_url
    } for content in results])
