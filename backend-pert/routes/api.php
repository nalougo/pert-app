<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PertApiController;

// Gérer les requêtes OPTIONS (preflight) pour toutes les routes API
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
        ->header('Access-Control-Max-Age', '86400');
})->where('any', '.*');

Route::post('/pert/calculate', [PertApiController::class, 'calculate']);

Route::get('/pert/projects', [PertApiController::class, 'listProjects']);
Route::get('/pert/projects/{filename}', [PertApiController::class, 'getProject']);
Route::delete('/pert/projects/{filename}', [PertApiController::class, 'deleteProject']);
